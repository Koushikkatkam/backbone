import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { cancelOrderAndRelease } from "@/server/services/harvestService";
import { z } from "zod";

const CancelSchema = z.object({
  action: z.enum(["CANCEL"]),
  reason: z.string().min(3, "Cancellation reason is required"),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: {
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        buyerProfile: { include: { user: true } },
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
    });

    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.BUYER, Role.LOGISTICS_OPERATOR, Role.FRANCHISE_OPERATOR]);

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    if (user && user.role === Role.BUYER && user.buyerProfile && order.buyerProfileId !== user.buyerProfile.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: You do not have permission to view other buyers' orders." },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, order });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch order";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.BUYER, Role.FRANCHISE_OPERATOR]);

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { OR: [{ id }, { orderNumber: id }] },
    });

    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
    }

    if (user && user.role === Role.BUYER && user.buyerProfile && order.buyerProfileId !== user.buyerProfile.id) {
      return NextResponse.json(
        { success: false, error: "UNAUTHORIZED: You cannot modify an order belonging to another buyer." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const data = CancelSchema.parse(body);

    if (data.action === "CANCEL") {
      const cancelled = await cancelOrderAndRelease(order.id, data.reason, user?.id);
      return NextResponse.json({
        success: true,
        message: `Order ${order.orderNumber} cancelled and stock reservation released back to inventory.`,
        order: cancelled,
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action." }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Order operation failed";
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
