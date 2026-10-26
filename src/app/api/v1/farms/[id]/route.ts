import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { logAuditEvent } from "@/server/services/auditService";
import { z } from "zod";

const UpdateFarmSchema = z.object({
  status: z.string().optional(),
  name: z.string().optional(),
  areaAcres: z.number().positive().optional(),
});

const MaintenanceSchema = z.object({
  category: z.string().min(2),
  description: z.string().min(5),
  cost: z.number().nonnegative().optional(),
  performedBy: z.string().min(2),
  status: z.string().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const farm = await prisma.farmUnit.findFirst({
      where: { OR: [{ id }, { farmCode: id }] },
      include: {
        farmerProfile: { include: { user: true } },
        installations: true,
        cropCycles: {
          include: { cropCatalogue: true, growthObservations: true, activityLogs: true },
        },
        sensorDevices: {
          include: { readings: { take: 5, orderBy: { timestamp: "desc" } }, alerts: true },
        },
        harvestRecords: {
          include: { lots: true },
        },
        maintenanceLogs: {
          orderBy: { performedAt: "desc" },
        },
      },
    });

    if (!farm) {
      return NextResponse.json({ success: false, error: "Farm not found" }, { status: 404 });
    }

    const user = await getCurrentUser();
    if (user && user.role === Role.FARMER && user.farmerProfile && farm.farmerProfileId !== user.farmerProfile.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: You do not have permission to view other farmers' plot records." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, farm });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch farm";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FRANCHISE_OPERATOR]);

    const { id } = await params;
    const farm = await prisma.farmUnit.findFirst({
      where: { OR: [{ id }, { farmCode: id }] },
    });

    if (!farm) {
      return NextResponse.json({ success: false, error: "Farm not found" }, { status: 404 });
    }

    const body = await req.json();
    const data = UpdateFarmSchema.parse(body);

    const updated = await prisma.farmUnit.update({
      where: { id: farm.id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(data.name ? { name: data.name } : {}),
        ...(data.areaAcres ? { areaAcres: data.areaAcres } : {}),
      },
    });

    await logAuditEvent({
      userId: user?.id,
      action: "FARM_UPDATED",
      entityType: "FarmUnit",
      entityId: farm.id,
      previousState: JSON.stringify({ status: farm.status, name: farm.name }),
      newState: JSON.stringify({ status: updated.status, name: updated.name }),
      reason: `Farm unit details updated by ${user?.name}`,
    });

    return NextResponse.json({ success: true, message: "Farm updated", farm: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update farm";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FRANCHISE_OPERATOR, Role.FARMER]);

    const { id } = await params;
    const farm = await prisma.farmUnit.findFirst({
      where: { OR: [{ id }, { farmCode: id }] },
    });

    if (!farm) {
      return NextResponse.json({ success: false, error: "Farm not found" }, { status: 404 });
    }

    if (user && user.role === Role.FARMER && user.farmerProfile && farm.farmerProfileId !== user.farmerProfile.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: You can only record maintenance for your own farm unit." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = MaintenanceSchema.parse(body);

    const log = await prisma.maintenanceLog.create({
      data: {
        farmUnitId: farm.id,
        category: data.category,
        description: data.description,
        cost: data.cost ?? 0,
        performedBy: data.performedBy,
        status: data.status || "COMPLETED",
        source: "DEMO",
      },
    });

    await logAuditEvent({
      userId: user?.id,
      action: "MAINTENANCE_LOGGED",
      entityType: "MaintenanceLog",
      entityId: log.id,
      newState: JSON.stringify(data),
      reason: `Maintenance logged for ${farm.name}: ${data.category}`,
    });

    return NextResponse.json({ success: true, message: "Maintenance log recorded", log });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to log maintenance";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
