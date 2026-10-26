import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role, Prisma } from "@prisma/client";
import { disbursePayableSettlement } from "@/server/services/financeService";
import { z } from "zod";

const DisburseSchema = z.object({
  payableId: z.string(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FRANCHISE_OPERATOR, Role.FARMER]);

    const payableWhere: Prisma.FarmerPayableWhereInput = {};
    const settlementWhere: Prisma.SettlementRecordWhereInput = {};
    if (user && user.role === Role.FARMER && user.farmerProfile) {
      payableWhere.farmerProfileId = user.farmerProfile.id;
      settlementWhere.farmerProfileId = user.farmerProfile.id;
    }

    const [payables, settlements] = await Promise.all([
      prisma.farmerPayable.findMany({
        where: payableWhere,
        include: {
          farmerProfile: {
            include: { user: true },
          },
          settlementRecord: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.settlementRecord.findMany({
        where: settlementWhere,
        include: {
          farmerProfile: {
            include: { user: true },
          },
          farmerPayable: true,
        },
        orderBy: { disbursedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      payables,
      settlements,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch settlements";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN]);

    const body = await req.json();
    const { payableId } = DisburseSchema.parse(body);

    const result = await disbursePayableSettlement(payableId, user?.id);

    return NextResponse.json({
      success: true,
      message: `Instant settlement ${result.settlement.settlementCode} executed for ₹${result.settlement.disbursedAmount}`,
      settlement: result.settlement,
      payable: result.payable,
      data: result,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Disbursal failed";
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
