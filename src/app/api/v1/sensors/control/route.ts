import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { executeSimulatedControl } from "@/server/services/sensorSimulationService";
import { z } from "zod";

const ControlSchema = z.object({
  farmUnitId: z.string().min(1),
  command: z.enum(["START_DRIP", "STOP_DRIP", "NUTRIENT_FLUSH", "CALIBRATE_PH"]),
  durationMinutes: z.number().positive().optional(),
  notes: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FARMER, Role.FRANCHISE_OPERATOR, Role.AGRONOMIST]);

    const body = await req.json();
    const data = ControlSchema.parse(body);

    if (user && user.role === Role.FARMER && user.farmerProfile) {
      const farm = await prisma.farmUnit.findUnique({
        where: { id: data.farmUnitId },
      });
      if (!farm) {
        return NextResponse.json({ success: false, error: "Farm unit not found" }, { status: 404 });
      }
      if (farm.farmerProfileId !== user.farmerProfile.id) {
        return NextResponse.json(
          { success: false, error: "UNAUTHORIZED: You can only control actuators for your own farm unit." },
          { status: 403 }
        );
      }
    }

    const result = await executeSimulatedControl({
      farmUnitId: data.farmUnitId,
      command: data.command,
      durationMinutes: data.durationMinutes,
      notes: data.notes,
      operatorUserId: user?.id,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Simulated control failed";
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
