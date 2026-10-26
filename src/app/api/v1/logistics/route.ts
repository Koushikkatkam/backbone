import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { scheduleShipmentPickup } from "@/server/services/logisticsService";
import { z } from "zod";

const SchedulePickupSchema = z.object({
  orderId: z.string().min(1),
  vehicleNumber: z.string().min(3),
  vehicleType: z.string().optional(),
  driverUserId: z.string().optional(),
  pickupLocation: z.string().min(3),
  destination: z.string().min(3),
  scheduledPickupTime: z.string().datetime(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    const isLogisticsOperator = user?.role === Role.LOGISTICS_OPERATOR;

    const [shipments, pendingOrders] = await Promise.all([
      prisma.shipment.findMany({
        where: isLogisticsOperator && user ? { driverUserId: user.id } : {},
        include: {
          order: {
            include: {
              buyerProfile: true,
              orderLines: {
                include: {
                  harvestLot: {
                    include: {
                      harvestRecord: {
                        include: { farmUnit: true, cropCycle: { include: { cropCatalogue: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
          driver: true,
          qualityInspection: true,
        },
        orderBy: { scheduledPickupTime: "desc" },
      }),
      prisma.order.findMany({
        where: {
          status: { in: ["RESERVED", "CONFIRMED"] },
          shipments: { none: {} },
        },
        include: {
          buyerProfile: true,
          orderLines: {
            include: {
              harvestLot: {
                include: {
                  harvestRecord: {
                    include: { farmUnit: true, cropCycle: { include: { cropCatalogue: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      count: shipments.length,
      shipments,
      pendingPickupQueue: pendingOrders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch logistics";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.LOGISTICS_OPERATOR, Role.FRANCHISE_OPERATOR]);

    const body = await req.json();
    const data = SchedulePickupSchema.parse(body);

    const shipment = await scheduleShipmentPickup({
      orderId: data.orderId,
      vehicleNumber: data.vehicleNumber,
      vehicleType: data.vehicleType,
      driverUserId: data.driverUserId || user?.id,
      pickupLocation: data.pickupLocation,
      destination: data.destination,
      scheduledPickupTime: new Date(data.scheduledPickupTime),
      operatorUserId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Pickup scheduled with vehicle ${data.vehicleNumber}.`,
      shipment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to schedule pickup";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
