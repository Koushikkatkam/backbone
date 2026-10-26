import { prisma } from "@/lib/prisma";
import { ShipmentStatus, OrderStatus } from "@prisma/client";
import { logAuditEvent } from "./auditService";

export interface SchedulePickupParams {
  orderId: string;
  vehicleNumber: string;
  vehicleType?: string;
  driverUserId?: string;
  pickupLocation: string;
  destination: string;
  scheduledPickupTime: Date;
  operatorUserId?: string;
}

export interface DispatchShipmentParams {
  shipmentId: string;
  temperatureLogC?: number;
  trackingNotes?: string;
  operatorUserId?: string;
}

export interface ConfirmDeliveryParams {
  shipmentId: string;
  inspectedBy: string;
  sampledQuantityKg: number;
  totalDeliveredQuantityKg: number;
  acceptedQuantityKg: number;
  rejectedQuantityKg?: number;
  verifiedGrade: string;
  freshnessScore: number;
  rejectionReason?: string;
  operatorUserId?: string;
}

/**
 * Schedule a refrigerated pickup for a confirmed/reserved order.
 */
export async function scheduleShipmentPickup(params: SchedulePickupParams) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: params.orderId },
      include: { orderLines: true },
    });

    if (!order) {
      throw new Error(`Order ${params.orderId} not found.`);
    }

    const shipmentCode = `SHP-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const shipment = await tx.shipment.create({
      data: {
        shipmentCode,
        orderId: params.orderId,
        vehicleNumber: params.vehicleNumber,
        vehicleType: params.vehicleType || "Refrigerated Mini-Van 1.5T",
        driverUserId: params.driverUserId,
        pickupLocation: params.pickupLocation,
        destination: params.destination,
        scheduledPickupTime: params.scheduledPickupTime,
        status: ShipmentStatus.SCHEDULED,
      },
      include: {
        order: { include: { buyerProfile: true } },
        driver: true,
      },
    });

    await logAuditEvent(
      {
        userId: params.operatorUserId,
        action: "SHIPMENT_SCHEDULED",
        entityType: "Shipment",
        entityId: shipment.id,
        previousState: "UNASSIGNED",
        newState: ShipmentStatus.SCHEDULED,
        reason: `Reefer pickup scheduled with vehicle ${params.vehicleNumber}`,
      },
      tx
    );

    return shipment;
  });
}

/**
 * Dispatch shipment: Marks shipment as IN_TRANSIT and records actual pickup time.
 */
export async function dispatchShipment(params: DispatchShipmentParams) {
  return await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: params.shipmentId },
      include: { order: true },
    });

    if (!shipment) {
      throw new Error(`Shipment ${params.shipmentId} not found.`);
    }

    if (shipment.status === ShipmentStatus.DELIVERED) {
      throw new Error(`Shipment ${shipment.shipmentCode} has already been delivered.`);
    }

    const now = new Date();

    const updatedShipment = await tx.shipment.update({
      where: { id: params.shipmentId },
      data: {
        status: ShipmentStatus.IN_TRANSIT,
        actualPickupTime: now,
        temperatureLogC: params.temperatureLogC ?? 4.2,
        trackingNotes: params.trackingNotes ?? "Departed cold hub. Temperature verified optimal.",
      },
    });

    // Update parent order status to IN_TRANSIT
    await tx.order.update({
      where: { id: shipment.orderId },
      data: { status: OrderStatus.IN_TRANSIT },
    });

    await logAuditEvent(
      {
        userId: params.operatorUserId,
        action: "SHIPMENT_DISPATCHED",
        entityType: "Shipment",
        entityId: shipment.id,
        previousState: shipment.status,
        newState: ShipmentStatus.IN_TRANSIT,
        reason: `Shipment departed at ${now.toISOString()}. Reefer temp: ${params.temperatureLogC ?? 4.2}°C`,
      },
      tx
    );

    return updatedShipment;
  });
}

/**
 * INVARIANT: Delivery CANNOT precede dispatch.
 * Confirms delivery, records QC inspection, and triggers Farmer Payable + Buyer Invoice.
 */
export async function confirmDeliveryAndQC(params: ConfirmDeliveryParams) {
  return await prisma.$transaction(async (tx) => {
    const shipment = await tx.shipment.findUnique({
      where: { id: params.shipmentId },
      include: {
        order: {
          include: {
            buyerProfile: true,
            orderLines: {
              include: {
                harvestLot: {
                  include: {
                    harvestRecord: {
                      include: {
                        farmUnit: {
                          include: { farmerProfile: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      throw new Error(`Shipment ${params.shipmentId} not found.`);
    }

    // INVARIANT ENFORCEMENT: A delivery cannot precede dispatch
    if (shipment.status !== ShipmentStatus.IN_TRANSIT || !shipment.actualPickupTime) {
      throw new Error(
        `INVARIANT_VIOLATION: Cannot mark shipment as DELIVERED before it has been dispatched (Current status: ${shipment.status}, Actual pickup: ${shipment.actualPickupTime ?? "none"}).`
      );
    }

    const now = new Date();

    // 1. Mark shipment DELIVERED
    const updatedShipment = await tx.shipment.update({
      where: { id: params.shipmentId },
      data: {
        status: ShipmentStatus.DELIVERED,
        deliveredTime: now,
      },
    });

    // 2. Mark order DELIVERED
    await tx.order.update({
      where: { id: shipment.orderId },
      data: { status: OrderStatus.DELIVERED },
    });

    // 3. Create QualityInspection
    const inspectionCode = `QC-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const line = shipment.order.orderLines[0];

    const inspection = await tx.qualityInspection.create({
      data: {
        inspectionCode,
        shipmentId: shipment.id,
        harvestLotId: line?.harvestLotId,
        inspectedBy: params.inspectedBy,
        inspectedAt: now,
        verifiedGrade: params.verifiedGrade,
        sampledQuantityKg: params.sampledQuantityKg,
        totalDeliveredQuantityKg: params.totalDeliveredQuantityKg,
        acceptedQuantityKg: params.acceptedQuantityKg,
        rejectedQuantityKg: params.rejectedQuantityKg ?? 0,
        rejectionReason: params.rejectionReason,
        freshnessScore: params.freshnessScore,
        status: (params.rejectedQuantityKg ?? 0) > 0 ? "PARTIAL_ACCEPTANCE" : "ACCEPTED",
        source: "DEMO",
      },
    });

    // 4. Update lot sold vs spoiled quantities
    if (line?.harvestLot) {
      const lot = line.harvestLot;
      await tx.harvestLot.update({
        where: { id: lot.id },
        data: {
          reservedQuantityKg: Math.max(0, lot.reservedQuantityKg - line.quantityKg),
          soldQuantityKg: lot.soldQuantityKg + params.acceptedQuantityKg,
          spoiledQuantityKg: lot.spoiledQuantityKg + (params.rejectedQuantityKg ?? 0),
        },
      });

      // Update OrderLine accepted quantity
      await tx.orderLine.update({
        where: { id: line.id },
        data: { acceptedQuantityKg: params.acceptedQuantityKg },
      });

      // 5. Automatically create FarmerPayable from accepted quantity * agreed price
      const farmerProfile = lot.harvestRecord.farmUnit.farmerProfile;
      const payableGross = Math.round(params.acceptedQuantityKg * lot.unitPricePerKg * 100) / 100;
      const payableCode = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const dueDate = new Date(now.getTime() + 24 * 3600 * 1000); // 24-hour settlement SLA

      await tx.farmerPayable.create({
        data: {
          payableCode,
          farmerProfileId: farmerProfile.id,
          grossAmount: payableGross,
          deductionsAmount: 0,
          netPayable: payableGross,
          reason: `Auto-generated for Order ${shipment.order.orderNumber} (Accepted ${params.acceptedQuantityKg} kg @ ₹${lot.unitPricePerKg}/kg)`,
          status: "PENDING",
          dueDate,
        },
      });
    }

    // 6. Create or update buyer invoice
    const existingInvoice = await tx.invoice.findUnique({
      where: { orderId: shipment.orderId },
    });

    if (!existingInvoice) {
      const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      const gross = Math.round(params.acceptedQuantityKg * (line?.unitPricePerKg ?? 40) * 100) / 100;
      const tax = Math.round(gross * 0.05 * 100) / 100;
      const net = gross + tax;

      await tx.invoice.create({
        data: {
          invoiceNumber,
          orderId: shipment.orderId,
          grossAmount: gross,
          taxAmount: tax,
          netAmount: net,
          dueDate: new Date(now.getTime() + 7 * 24 * 3600 * 1000),
          paymentStatus: "UNPAID",
          receivables: {
            create: {
              amount: net,
              status: "PENDING",
              source: "SIMULATED",
            },
          },
        },
      });
    }

    // 7. Log audit event
    await logAuditEvent(
      {
        userId: params.operatorUserId,
        action: "DELIVERY_AND_QC_ACCEPTED",
        entityType: "QualityInspection",
        entityId: inspection.id,
        previousState: ShipmentStatus.IN_TRANSIT,
        newState: ShipmentStatus.DELIVERED,
        reason: `Delivery accepted: ${params.acceptedQuantityKg} kg Grade-${params.verifiedGrade}. Freshness: ${params.freshnessScore}/10`,
      },
      tx
    );

    return {
      shipment: updatedShipment,
      inspection,
    };
  });
}
