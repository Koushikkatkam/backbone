import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role, OrderStatus, Prisma } from "@prisma/client";
import { reserveLotInventory } from "@/server/services/harvestService";
import { z } from "zod";

const CreateOrderSchema = z.object({
  harvestLotId: z.string(),
  quantityKg: z.number().positive(),
  deliveryAddress: z.string().min(5),
  expectedDeliveryDate: z.string().datetime(),
  notes: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.BUYER, Role.LOGISTICS_OPERATOR, Role.FRANCHISE_OPERATOR]);

    const whereClause: Prisma.OrderWhereInput = {};
    if (user && user.role === Role.BUYER && user.buyerProfile) {
      whereClause.buyerProfileId = user.buyerProfile.id;
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        buyerProfile: {
          include: { user: true },
        },
        orderLines: {
          include: {
            harvestLot: {
              include: {
                harvestRecord: {
                  include: {
                    farmUnit: true,
                    cropCycle: { include: { cropCatalogue: true } },
                  },
                },
              },
            },
          },
        },
        shipments: {
          include: { driver: true, qualityInspection: true },
        },
        invoice: {
          include: { receivables: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: orders.length, orders });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch orders";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.BUYER]);

    const body = await req.json();
    const data = CreateOrderSchema.parse(body);

    const buyerProfile = await prisma.buyerProfile.findFirst({
      where: user?.role === Role.BUYER ? { userId: user.id } : {},
    });

    if (!buyerProfile) {
      return NextResponse.json(
        { success: false, error: "Buyer profile not configured for active session." },
        { status: 400 }
      );
    }

    const lot = await prisma.harvestLot.findUnique({
      where: { id: data.harvestLotId },
    });

    if (!lot) {
      return NextResponse.json({ success: false, error: "Harvest lot not found." }, { status: 404 });
    }

    const orderNumber = `ORD-2026-10-${Math.floor(1000 + Math.random() * 9000)}`;
    const lineTotal = data.quantityKg * lot.unitPricePerKg;

    // Execute reservation transaction first (Enforces anti-oversell invariant)
    await reserveLotInventory(lot.id, data.quantityKg, orderNumber, user?.id);

    // Create order and order line
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerProfileId: buyerProfile.id,
        totalAmount: lineTotal,
        status: OrderStatus.RESERVED,
        deliveryAddress: data.deliveryAddress,
        expectedDeliveryDate: new Date(data.expectedDeliveryDate),
        notes: data.notes,
        source: "DEMO",
        orderLines: {
          create: {
            harvestLotId: lot.id,
            quantityKg: data.quantityKg,
            unitPricePerKg: lot.unitPricePerKg,
            lineTotal,
          },
        },
      },
      include: {
        orderLines: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Order ${orderNumber} created with inventory reserved.`,
      order,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Order creation failed";
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
