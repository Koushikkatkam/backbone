import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./auditService";

export interface ReservationResult {
  success: boolean;
  lotId: string;
  lotCode: string;
  reservedKg: number;
  remainingAvailableKg: number;
  error?: string;
}

export async function getAllHarvestLots() {
  return prisma.harvestLot.findMany({
    include: {
      harvestRecord: {
        include: {
          farmUnit: {
            include: {
              farmerProfile: {
                include: { user: true },
              },
            },
          },
          cropCycle: {
            include: { cropCatalogue: true },
          },
        },
      },
      qualityInspections: true,
      orderLines: {
        include: {
          order: {
            include: { buyerProfile: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getHarvestLotByCode(lotCode: string) {
  return prisma.harvestLot.findUnique({
    where: { lotCode },
    include: {
      harvestRecord: {
        include: {
          farmUnit: {
            include: {
              farmerProfile: {
                include: { user: true },
              },
              installations: true,
              sensorDevices: {
                include: {
                  readings: {
                    take: 10,
                    orderBy: { timestamp: "desc" },
                  },
                },
              },
            },
          },
          cropCycle: {
            include: {
              cropCatalogue: true,
              growthObservations: {
                orderBy: { observedDate: "desc" },
                take: 5,
              },
              advisories: {
                orderBy: { createdAt: "desc" },
                take: 5,
              },
            },
          },
        },
      },
      qualityInspections: {
        include: { shipment: true },
      },
      inventoryMovements: {
        orderBy: { recordedAt: "desc" },
      },
      orderLines: {
        include: {
          order: {
            include: {
              buyerProfile: true,
              shipments: true,
              invoice: {
                include: { receivables: true },
              },
            },
          },
        },
      },
    },
  });
}

/**
 * INVARIANT: Available inventory cannot be oversold.
 * Active reservations decrement available stock.
 */
export async function reserveLotInventory(
  lotId: string,
  quantityKg: number,
  referenceOrderNumber: string,
  operatorUserId?: string
): Promise<ReservationResult> {
  return await prisma.$transaction(async (tx) => {
    const lot = await tx.harvestLot.findUnique({
      where: { id: lotId },
    });

    if (!lot) {
      throw new Error(`Harvest lot ${lotId} not found.`);
    }

    if (quantityKg <= 0) {
      throw new Error(`Requested quantity must be greater than zero.`);
    }

    if (lot.availableQuantityKg < quantityKg) {
      throw new Error(
        `INVARIANT_VIOLATION: Requested ${quantityKg} kg exceeds available quantity (${lot.availableQuantityKg} kg) for lot ${lot.lotCode}. Overselling prevented.`
      );
    }

    const newAvailable = lot.availableQuantityKg - quantityKg;
    const newReserved = lot.reservedQuantityKg + quantityKg;

    const updated = await tx.harvestLot.update({
      where: { id: lotId },
      data: {
        availableQuantityKg: newAvailable,
        reservedQuantityKg: newReserved,
        curationStatus: newAvailable === 0 ? "FULLY_COMMITTED" : "PARTIALLY_RESERVED",
      },
    });

    // Record inventory audit trail
    await tx.inventoryMovement.create({
      data: {
        harvestLotId: lotId,
        movementType: "RESERVATION_HOLD",
        quantityKg,
        balanceAfterKg: newAvailable,
        reason: `Reserved for Order ${referenceOrderNumber}`,
        referenceCode: referenceOrderNumber,
        recordedBy: operatorUserId ?? "System Reserve Engine",
      },
    });

    await logAuditEvent(
      {
        userId: operatorUserId,
        action: "RESERVATION_HOLD",
        entityType: "HarvestLot",
        entityId: lotId,
        previousState: JSON.stringify({ available: lot.availableQuantityKg, reserved: lot.reservedQuantityKg }),
        newState: JSON.stringify({ available: newAvailable, reserved: newReserved }),
        reason: `Reserved ${quantityKg} kg for Order ${referenceOrderNumber}`,
      },
      tx
    );

    return {
      success: true,
      lotId: updated.id,
      lotCode: updated.lotCode,
      reservedKg: quantityKg,
      remainingAvailableKg: newAvailable,
    };
  });
}

/**
 * INVARIANT: Cancelled reservations release stock back to available pool.
 */
export async function releaseLotInventory(
  lotId: string,
  quantityKg: number,
  reason: string,
  operatorUserId?: string
) {
  return await prisma.$transaction(async (tx) => {
    const lot = await tx.harvestLot.findUnique({
      where: { id: lotId },
    });

    if (!lot) throw new Error(`Harvest lot ${lotId} not found.`);

    const newReserved = Math.max(0, lot.reservedQuantityKg - quantityKg);
    const newAvailable = lot.availableQuantityKg + quantityKg;

    const updated = await tx.harvestLot.update({
      where: { id: lotId },
      data: {
        availableQuantityKg: newAvailable,
        reservedQuantityKg: newReserved,
        curationStatus: "AVAILABLE",
      },
    });

    await tx.inventoryMovement.create({
      data: {
        harvestLotId: lotId,
        movementType: "RESERVATION_RELEASE",
        quantityKg,
        balanceAfterKg: newAvailable,
        reason,
        recordedBy: operatorUserId ?? "System Release Engine",
      },
    });

    await logAuditEvent(
      {
        userId: operatorUserId,
        action: "RESERVATION_RELEASE",
        entityType: "HarvestLot",
        entityId: lotId,
        previousState: JSON.stringify({ available: lot.availableQuantityKg, reserved: lot.reservedQuantityKg }),
        newState: JSON.stringify({ available: newAvailable, reserved: newReserved }),
        reason,
      },
      tx
    );

    return updated;
  });
}

export interface RegisterHarvestParams {
  cropCycleId: string;
  harvestDate?: Date;
  grossQuantityKg: number;
  marketableQuantityKg: number;
  grade: string;
  rejectionReason?: string;
  farmgateNotes?: string;
  unitPricePerKg?: number;
  storageFacility?: string;
  operatorUserId?: string;
}

/**
 * Register a farmgate harvest linked to a crop cycle,
 * creating an atomic traceable lot with origin and inventory audit trail.
 */
export async function registerHarvestRecord(params: RegisterHarvestParams) {
  return await prisma.$transaction(async (tx) => {
    const cycle = await tx.cropCycle.findUnique({
      where: { id: params.cropCycleId },
      include: {
        cropCatalogue: true,
        farmUnit: { include: { farmerProfile: true } },
      },
    });

    if (!cycle) {
      throw new Error(`Crop cycle ${params.cropCycleId} not found.`);
    }

    if (params.grossQuantityKg <= 0) {
      throw new Error(`Gross harvested quantity must be greater than zero.`);
    }

    if (params.marketableQuantityKg < 0 || params.marketableQuantityKg > params.grossQuantityKg) {
      throw new Error(
        `Marketable quantity (${params.marketableQuantityKg} kg) cannot exceed gross quantity (${params.grossQuantityKg} kg).`
      );
    }

    const harvestDate = params.harvestDate ?? new Date();
    const harvestCode = `HRV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const lotCode = `LOT-${cycle.cropCatalogue.cropCode}-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const unitPrice = params.unitPricePerKg ?? cycle.cropCatalogue.benchmarkMarketPricePerKg;

    // 1. Create HarvestRecord
    const harvestRecord = await tx.harvestRecord.create({
      data: {
        harvestCode,
        cropCycleId: cycle.id,
        farmUnitId: cycle.farmUnitId,
        harvestDate,
        grossQuantityKg: params.grossQuantityKg,
        farmgateQualityNotes: params.farmgateNotes || "Farmgate harvest registered and graded under standard protocol.",
        loggedBy: params.operatorUserId ?? "Farmgate Field Operator",
        source: "DEMO",
      },
    });

    // 2. Create Traceable HarvestLot
    const lot = await tx.harvestLot.create({
      data: {
        lotCode,
        harvestRecordId: harvestRecord.id,
        grade: params.grade,
        initialQuantityKg: params.marketableQuantityKg,
        availableQuantityKg: params.marketableQuantityKg,
        reservedQuantityKg: 0,
        soldQuantityKg: 0,
        spoiledQuantityKg: params.grossQuantityKg - params.marketableQuantityKg,
        unitPricePerKg: unitPrice,
        curationStatus: "AVAILABLE",
        storageFacility: params.storageFacility || `${cycle.farmUnit.name} Storage Hub`,
      },
    });

    // 3. Record Initial Inventory Movement
    await tx.inventoryMovement.create({
      data: {
        harvestLotId: lot.id,
        movementType: "HARVEST_IN",
        quantityKg: params.marketableQuantityKg,
        balanceAfterKg: params.marketableQuantityKg,
        reason: `Initial harvest intake for ${lotCode} (${params.grossQuantityKg} gross - ${params.grossQuantityKg - params.marketableQuantityKg} post-harvest loss)`,
        referenceCode: harvestCode,
        recordedBy: params.operatorUserId ?? "System Harvest Logger",
      },
    });

    // 4. Update CropCycle actual harvest date & actual yield
    await tx.cropCycle.update({
      where: { id: cycle.id },
      data: {
        actualHarvestDate: harvestDate,
        actualYieldKg: cycle.actualYieldKg + params.marketableQuantityKg,
        stage: "HARVESTING",
      },
    });

    // 5. Audit log
    await logAuditEvent(
      {
        userId: params.operatorUserId,
        action: "HARVEST_REGISTERED",
        entityType: "HarvestLot",
        entityId: lot.id,
        newState: JSON.stringify({ lotCode, marketableKg: params.marketableQuantityKg, grade: params.grade }),
        reason: `Harvest registered: ${params.marketableQuantityKg} kg Grade-${params.grade} from ${cycle.farmUnit.name}`,
      },
      tx
    );

    return {
      harvestRecord,
      lot,
    };
  });
}

export interface AdjustLotParams {
  lotId: string;
  grade?: string;
  curationStatus?: string;
  quantityAdjustmentKg?: number;
  reason: string;
  operatorUserId?: string;
}

/**
 * Adjust harvest lot attributes or quantity with mandatory reason and audit log.
 */
export async function adjustLotInventory(params: AdjustLotParams) {
  if (!params.reason || params.reason.trim().length < 5) {
    throw new Error("Quantity adjustments require an explicit documented reason (min 5 chars).");
  }

  return await prisma.$transaction(async (tx) => {
    const lot = await tx.harvestLot.findUnique({
      where: { id: params.lotId },
    });

    if (!lot) throw new Error(`Harvest lot ${params.lotId} not found.`);

    let newAvailable = lot.availableQuantityKg;
    if (params.quantityAdjustmentKg !== undefined && params.quantityAdjustmentKg !== 0) {
      newAvailable = lot.availableQuantityKg + params.quantityAdjustmentKg;
      if (newAvailable < 0) {
        throw new Error(`Adjustment would result in negative available inventory (${newAvailable} kg).`);
      }
    }

    const updated = await tx.harvestLot.update({
      where: { id: params.lotId },
      data: {
        availableQuantityKg: newAvailable,
        grade: params.grade ?? lot.grade,
        curationStatus: params.curationStatus ?? lot.curationStatus,
      },
    });

    if (params.quantityAdjustmentKg !== undefined && params.quantityAdjustmentKg !== 0) {
      await tx.inventoryMovement.create({
        data: {
          harvestLotId: lot.id,
          movementType: "MANUAL_ADJUSTMENT",
          quantityKg: Math.abs(params.quantityAdjustmentKg),
          balanceAfterKg: newAvailable,
          reason: params.reason,
          recordedBy: params.operatorUserId ?? "Inventory Manager",
        },
      });
    }

    await logAuditEvent(
      {
        userId: params.operatorUserId,
        action: "LOT_ADJUSTMENT",
        entityType: "HarvestLot",
        entityId: lot.id,
        previousState: JSON.stringify({ available: lot.availableQuantityKg, grade: lot.grade, status: lot.curationStatus }),
        newState: JSON.stringify({ available: newAvailable, grade: updated.grade, status: updated.curationStatus }),
        reason: params.reason,
      },
      tx
    );

    return updated;
  });
}

/**
 * INVARIANT: Cancelling an order releases its active reservation exactly once.
 */
export async function cancelOrderAndRelease(orderId: string, reason: string, operatorUserId?: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: {
        orderLines: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found.`);
    }

    if (order.status === "CANCELLED") {
      throw new Error(`Order ${order.orderNumber} is already cancelled.`);
    }

    if (order.status === "DELIVERED" || order.status === "COMPLETED") {
      throw new Error(`Cannot cancel order ${order.orderNumber} in ${order.status} state.`);
    }

    // Release reservations for all order lines
    for (const line of order.orderLines) {
      const lot = await tx.harvestLot.findUnique({
        where: { id: line.harvestLotId },
      });

      if (lot) {
        const newReserved = Math.max(0, lot.reservedQuantityKg - line.quantityKg);
        const newAvailable = lot.availableQuantityKg + line.quantityKg;

        await tx.harvestLot.update({
          where: { id: lot.id },
          data: {
            availableQuantityKg: newAvailable,
            reservedQuantityKg: newReserved,
            curationStatus: "AVAILABLE",
          },
        });

        await tx.inventoryMovement.create({
          data: {
            harvestLotId: lot.id,
            movementType: "RESERVATION_RELEASE",
            quantityKg: line.quantityKg,
            balanceAfterKg: newAvailable,
            reason: `Order ${order.orderNumber} cancelled: ${reason}`,
            referenceCode: order.orderNumber,
            recordedBy: operatorUserId ?? "System Order Engine",
          },
        });
      }
    }

    // Update order status to CANCELLED
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    await logAuditEvent(
      {
        userId: operatorUserId,
        action: "ORDER_CANCELLED",
        entityType: "Order",
        entityId: order.id,
        previousState: order.status,
        newState: "CANCELLED",
        reason: `Order cancelled and reservations released: ${reason}`,
      },
      tx
    );

    return updatedOrder;
  });
}

