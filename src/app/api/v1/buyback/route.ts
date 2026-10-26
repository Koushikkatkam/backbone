import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { commitFarmerBuyback } from "@/server/services/buybackService";
import { z } from "zod";

const CommitSchema = z.object({
  buybackOfferId: z.string().min(1),
  committedQuantityKg: z.number().positive("Committed quantity must be positive"),
  farmerProfileId: z.string().optional(),
});

export async function GET() {
  try {
    const offers = await prisma.buybackOffer.findMany({
      include: {
        cropCatalogue: true,
        responses: {
          include: {
            farmerProfile: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: offers.length, offers });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch buyback offers";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FARMER, Role.FRANCHISE_OPERATOR]);

    const body = await req.json();
    const data = CommitSchema.parse(body);

    let targetFarmerProfileId: string | undefined;

    if (user?.role === Role.FARMER) {
      if (!user.farmerProfile?.id) {
        return NextResponse.json(
          { success: false, error: "Farmer profile not linked to authenticated user." },
          { status: 400 }
        );
      }
      targetFarmerProfileId = user.farmerProfile.id;
    } else {
      if (!data.farmerProfileId) {
        return NextResponse.json(
          { success: false, error: "VALIDATION_ERROR: farmerProfileId is required when committing on behalf of a farmer." },
          { status: 400 }
        );
      }
      targetFarmerProfileId = data.farmerProfileId;
    }

    const commitment = await commitFarmerBuyback({
      buybackOfferId: data.buybackOfferId,
      farmerProfileId: targetFarmerProfileId,
      committedQuantityKg: data.committedQuantityKg,
      operatorUserId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Off-take agreement signed: ${data.committedQuantityKg} kg committed.`,
      commitment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Buyback commitment failed";
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
