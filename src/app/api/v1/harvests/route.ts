import { NextRequest, NextResponse } from "next/server";
import { getAllHarvestLots, getHarvestLotByCode, registerHarvestRecord } from "@/server/services/harvestService";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { z } from "zod";

const RegisterHarvestSchema = z.object({
  cropCycleId: z.string().min(1),
  grossQuantityKg: z.number().positive(),
  marketableQuantityKg: z.number().nonnegative(),
  grade: z.enum(["GRADE_A", "GRADE_B", "GRADE_C"]),
  rejectionReason: z.string().optional(),
  farmgateNotes: z.string().optional(),
  unitPricePerKg: z.number().positive().optional(),
  storageFacility: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const lotCode = searchParams.get("lotCode");

    if (lotCode) {
      const lot = await getHarvestLotByCode(lotCode);
      if (!lot) {
        return NextResponse.json({ success: false, error: "Harvest lot not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, lot });
    }

    const lots = await getAllHarvestLots();
    return NextResponse.json({ success: true, count: lots.length, lots });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch harvests";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FARMER, Role.FRANCHISE_OPERATOR, Role.AGRONOMIST]);

    const body = await req.json();
    const data = RegisterHarvestSchema.parse(body);

    const result = await registerHarvestRecord({
      cropCycleId: data.cropCycleId,
      grossQuantityKg: data.grossQuantityKg,
      marketableQuantityKg: data.marketableQuantityKg,
      grade: data.grade,
      rejectionReason: data.rejectionReason,
      farmgateNotes: data.farmgateNotes,
      unitPricePerKg: data.unitPricePerKg,
      storageFacility: data.storageFacility,
      operatorUserId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Harvest registered successfully. Traceable lot ${result.lot.lotCode} created.`,
      harvest: result.harvestRecord,
      lot: result.lot,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Harvest registration failed";
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
