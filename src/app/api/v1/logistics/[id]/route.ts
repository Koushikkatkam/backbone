import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { dispatchShipment, confirmDeliveryAndQC } from "@/server/services/logisticsService";
import { z } from "zod";

const LogisticsActionSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("DISPATCH"),
    temperatureLogC: z.number().optional(),
    trackingNotes: z.string().optional(),
  }),
  z.object({
    action: z.literal("DELIVER_AND_ACCEPT"),
    inspectedBy: z.string().min(2),
    sampledQuantityKg: z.number().positive(),
    totalDeliveredQuantityKg: z.number().positive(),
    acceptedQuantityKg: z.number().positive(),
    rejectedQuantityKg: z.number().nonnegative().optional(),
    verifiedGrade: z.enum(["GRADE_A", "GRADE_B", "GRADE_C"]),
    freshnessScore: z.number().min(1).max(10),
    rejectionReason: z.string().optional(),
  }),
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.LOGISTICS_OPERATOR, Role.BUYER]);

    const { id } = await params;
    const body = await req.json();
    const data = LogisticsActionSchema.parse(body);

    if (data.action === "DISPATCH") {
      requireRole(user, [Role.ADMIN, Role.LOGISTICS_OPERATOR]);

      const shipment = await dispatchShipment({
        shipmentId: id,
        temperatureLogC: data.temperatureLogC,
        trackingNotes: data.trackingNotes,
        operatorUserId: user?.id,
      });

      return NextResponse.json({
        success: true,
        message: `Shipment ${shipment.shipmentCode} marked IN_TRANSIT. Departure time recorded.`,
        shipment,
      });
    }

    if (data.action === "DELIVER_AND_ACCEPT") {
      if (user && user.role === Role.BUYER && user.buyerProfile) {
        const shipment = await prisma.shipment.findUnique({
          where: { id },
          include: { order: true },
        });
        if (!shipment) {
          return NextResponse.json({ success: false, error: "Shipment not found" }, { status: 404 });
        }
        if (shipment.order.buyerProfileId !== user.buyerProfile.id) {
          return NextResponse.json(
            { success: false, error: "UNAUTHORIZED: You cannot accept delivery of a shipment belonging to another buyer." },
            { status: 403 }
          );
        }
      }

      const result = await confirmDeliveryAndQC({
        shipmentId: id,
        inspectedBy: data.inspectedBy,
        sampledQuantityKg: data.sampledQuantityKg,
        totalDeliveredQuantityKg: data.totalDeliveredQuantityKg,
        acceptedQuantityKg: data.acceptedQuantityKg,
        rejectedQuantityKg: data.rejectedQuantityKg,
        verifiedGrade: data.verifiedGrade,
        freshnessScore: data.freshnessScore,
        rejectionReason: data.rejectionReason,
        operatorUserId: user?.id,
      });

      return NextResponse.json({
        success: true,
        message: `Shipment marked DELIVERED. QC accepted: ${data.acceptedQuantityKg} kg Grade-${data.verifiedGrade}. Farmer payable & buyer invoice generated.`,
        result,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Logistics operation failed";
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
