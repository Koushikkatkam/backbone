import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { CropStage, Prisma, Role } from "@prisma/client";
import { logAuditEvent } from "@/server/services/auditService";
import { z } from "zod";

const CropActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("UPDATE_STAGE"),
    cropCycleId: z.string().min(1),
    stage: z.nativeEnum(CropStage),
  }),
  z.object({
    action: z.literal("LOG_ACTIVITY"),
    cropCycleId: z.string().min(1),
    activityType: z.string().min(2),
    inputsApplied: z.string().min(2),
    waterUsedLiters: z.number().nonnegative().optional(),
    notes: z.string().optional(),
  }),
]);

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage");

    const whereClause: Prisma.CropCycleWhereInput = {};
    if (stage) whereClause.stage = stage as CropStage;

    // Tenant isolation: if authenticated user is a FARMER, only show crop cycles for their farm
    if (user && user.role === Role.FARMER && user.farmerProfile) {
      whereClause.farmUnit = {
        farmerProfileId: user.farmerProfile.id,
      };
    }

    const [catalogues, activeCycles] = await Promise.all([
      prisma.cropCatalogue.findMany({
        orderBy: { name: "asc" },
      }),
      prisma.cropCycle.findMany({
        where: whereClause,
        include: {
          cropCatalogue: true,
          farmUnit: {
            include: {
              farmerProfile: {
                include: { user: true },
              },
            },
          },
          growthObservations: {
            orderBy: { observedDate: "desc" },
            take: 3,
          },
          advisories: {
            orderBy: { createdAt: "desc" },
            take: 3,
          },
          activityLogs: {
            orderBy: { loggedDate: "desc" },
            take: 5,
          },
        },
        orderBy: { plantedDate: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      catalogues,
      activeCycles,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch crops";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.AGRONOMIST, Role.FARMER, Role.FRANCHISE_OPERATOR]);

    const body = await req.json();
    const data = CropActionSchema.parse(body);

    if (data.action === "UPDATE_STAGE") {
      const cycle = await prisma.cropCycle.findUnique({
        where: { id: data.cropCycleId },
        include: { cropCatalogue: true, farmUnit: true },
      });

      if (!cycle) {
        return NextResponse.json({ success: false, error: "Crop cycle not found" }, { status: 404 });
      }

      if (user?.role === Role.FARMER && cycle.farmUnit?.farmerProfileId !== user.farmerProfile?.id) {
        return NextResponse.json(
          { success: false, error: "UNAUTHORIZED: You can only update crop cycles for your own farm." },
          { status: 403 }
        );
      }

      const updated = await prisma.cropCycle.update({
        where: { id: cycle.id },
        data: { stage: data.stage },
      });

      await logAuditEvent({
        userId: user?.id,
        action: "CROP_STAGE_UPDATED",
        entityType: "CropCycle",
        entityId: cycle.id,
        previousState: cycle.stage,
        newState: data.stage,
        reason: `Crop stage transitioned from ${cycle.stage} to ${data.stage} for ${cycle.cropCatalogue.name}`,
      });

      return NextResponse.json({
        success: true,
        message: `Crop cycle advanced to ${data.stage}`,
        cycle: updated,
      });
    }

    if (data.action === "LOG_ACTIVITY") {
      const cycle = await prisma.cropCycle.findUnique({
        where: { id: data.cropCycleId },
        include: { farmUnit: true },
      });

      if (!cycle) {
        return NextResponse.json({ success: false, error: "Crop cycle not found" }, { status: 404 });
      }

      if (user?.role === Role.FARMER && cycle.farmUnit?.farmerProfileId !== user.farmerProfile?.id) {
        return NextResponse.json(
          { success: false, error: "UNAUTHORIZED: You can only log activities for your own farm." },
          { status: 403 }
        );
      }

      const log = await prisma.cropInputActivityLog.create({
        data: {
          cropCycleId: data.cropCycleId,
          activityType: data.activityType,
          inputsApplied: data.inputsApplied,
          waterUsedLiters: data.waterUsedLiters ?? 0,
          notes: data.notes,
          loggedBy: user?.name || "Farmer",
        },
      });

      await logAuditEvent({
        userId: user?.id,
        action: "CROP_ACTIVITY_LOGGED",
        entityType: "CropInputActivityLog",
        entityId: log.id,
        newState: JSON.stringify(data),
        reason: `Activity logged: ${data.activityType} (${data.inputsApplied})`,
      });

      return NextResponse.json({
        success: true,
        message: "Crop input activity logged",
        log,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update crop cycle";
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
