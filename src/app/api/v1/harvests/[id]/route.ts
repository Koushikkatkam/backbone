import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { adjustLotInventory } from "@/server/services/harvestService";
import { z } from "zod";

const UpdateLotSchema = z.object({
  grade: z.string().optional(),
  curationStatus: z.string().optional(),
  quantityAdjustmentKg: z.number().optional(),
  reason: z.string().min(5, "Adjustment reason must be at least 5 characters"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lot = await prisma.harvestLot.findFirst({
      where: {
        OR: [{ id }, { lotCode: id }],
      },
      include: {
        harvestRecord: {
          include: {
            cropCycle: { include: { cropCatalogue: true } },
            farmUnit: { include: { farmerProfile: { include: { user: true } } } },
          },
        },
        inventoryMovements: { orderBy: { recordedAt: "desc" } },
        qualityInspections: true,
      },
    });

    if (!lot) {
      return NextResponse.json({ success: false, error: "Harvest lot not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true, lot });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch lot";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FRANCHISE_OPERATOR, Role.AGRONOMIST]);

    const { id } = await params;
    const lot = await prisma.harvestLot.findFirst({
      where: { OR: [{ id }, { lotCode: id }] },
    });

    if (!lot) {
      return NextResponse.json({ success: false, error: "Harvest lot not found." }, { status: 404 });
    }

    const body = await req.json();
    const data = UpdateLotSchema.parse(body);

    const updated = await adjustLotInventory({
      lotId: lot.id,
      grade: data.grade,
      curationStatus: data.curationStatus,
      quantityAdjustmentKg: data.quantityAdjustmentKg,
      reason: data.reason,
      operatorUserId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: "Harvest lot updated and audit event recorded.",
      lot: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update harvest lot";
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
