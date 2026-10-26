import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { matchBuybackToBuyerDemand } from "@/server/services/buybackService";
import { z } from "zod";

const MatchDemandSchema = z.object({
  buybackResponseId: z.string().min(1),
  buyerProfileId: z.string().optional(),
  matchedQuantityKg: z.number().positive(),
  deliveryAddress: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FRANCHISE_OPERATOR]);

    const body = await req.json();
    const data = MatchDemandSchema.parse(body);

    const result = await matchBuybackToBuyerDemand({
      buybackResponseId: data.buybackResponseId,
      buyerProfileId: data.buyerProfileId,
      matchedQuantityKg: data.matchedQuantityKg,
      deliveryAddress: data.deliveryAddress || "ITC Agri-Business Division, Hyderabad Hub",
      operatorUserId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Committed buyback produce matched to B2B Order ${result.matchedOrder.orderNumber}.`,
      result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Matching buyback demand failed";
    const status = message.includes("UNAUTHORIZED")
      ? 403
      : message.includes("UNAUTHENTICATED")
      ? 401
      : message.includes("not found")
      ? 404
      : 400;
    return NextResponse.json({ success: false, error: message }, { status });
  }
}
