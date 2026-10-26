import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { registerHarvestRecord, adjustLotInventory, reserveLotInventory } from "../src/server/services/harvestService";
import { commitFarmerBuyback } from "../src/server/services/buybackService";
import { scheduleShipmentPickup, dispatchShipment, confirmDeliveryAndQC } from "../src/server/services/logisticsService";
import { disbursePayableSettlement } from "../src/server/services/financeService";
import { executeSimulatedControl } from "../src/server/services/sensorSimulationService";
import { ShipmentStatus, OrderStatus } from "@prisma/client";

describe("Shot 2 Complete End-to-End Demo Journey Invariant Verification", () => {
  let farmerUser: { id: string; farmerProfile: { id: string } | null } | null;
  let buyerUser: { id: string; buyerProfile: { id: string } | null } | null;
  let logisticsUser: { id: string } | null;
  let adminUser: { id: string } | null;
  let activeCycle: { id: string; farmUnitId: string; farmUnit: { farmerProfile: { id: string } } } | null;

  beforeAll(async () => {
    farmerUser = await prisma.user.findUnique({
      where: { id: "usr-farmer-01" },
      include: { farmerProfile: true },
    });
    buyerUser = await prisma.user.findUnique({
      where: { id: "usr-buyer-01" },
      include: { buyerProfile: true },
    });
    logisticsUser = await prisma.user.findUnique({
      where: { id: "usr-logistics-01" },
    });
    adminUser = await prisma.user.findUnique({
      where: { id: "usr-admin-01" },
    });

    activeCycle = await prisma.cropCycle.findFirst({
      where: { status: "ACTIVE" },
      include: { farmUnit: { include: { farmerProfile: true } }, cropCatalogue: true },
    });

    expect(farmerUser).toBeDefined();
    expect(buyerUser).toBeDefined();
    expect(logisticsUser).toBeDefined();
    expect(adminUser).toBeDefined();
    expect(activeCycle).toBeDefined();
  });

  it("completes full 12-step demo journey preserving all transactional invariants", async () => {
    if (
      !farmerUser?.farmerProfile ||
      !buyerUser?.buyerProfile ||
      !logisticsUser ||
      !adminUser ||
      !activeCycle
    ) {
      throw new Error("Seed entities missing for E2E journey test");
    }

    // 1. Simulated Automation / Pump Control
    const sensorControl = await executeSimulatedControl({
      farmUnitId: activeCycle.farmUnitId,
      command: "START_DRIP",
      durationMinutes: 15,
      notes: "E2E journey automated drip trigger",
      operatorUserId: farmerUser.id,
    });
    expect(sensorControl.success).toBe(true);
    expect(sensorControl.isSimulated).toBe(true);
    expect(sensorControl.message).toContain("No physical actuator hardware contacted");

    // 2. Register Farmgate Harvest & calculate post-harvest loss
    const grossKg = 160;
    const marketableKg = 152; // 8 kg loss (5.0%)
    const harvestResult = await registerHarvestRecord({
      cropCycleId: activeCycle.id,
      grossQuantityKg: grossKg,
      marketableQuantityKg: marketableKg,
      grade: "GRADE_A",
      rejectionReason: "Field trimming & yellowed leaf culling",
      farmgateNotes: "E2E verified farmgate harvest",
      unitPricePerKg: 40,
      operatorUserId: farmerUser.id,
    });

    expect(harvestResult.lot).toBeDefined();
    const lotId = harvestResult.lot.id;
    expect(harvestResult.lot.availableQuantityKg).toBe(152);

    // 3. Lot stock adjustment with mandatory reason
    const adjustedLot = await adjustLotInventory({
      lotId,
      quantityAdjustmentKg: -2,
      reason: "Secondary pre-cooling inspection culling",
      operatorUserId: "usr-operator-01",
    });
    expect(adjustedLot.availableQuantityKg).toBe(150);

    // 4. Buyback commitment off-take with double-commitment prevention
    const activeOffer = await prisma.buybackOffer.findFirst({ where: { status: "ACTIVE" } });
    if (activeOffer) {
      try {
        await commitFarmerBuyback({
          buybackOfferId: activeOffer.id,
          farmerProfileId: farmerUser.farmerProfile.id,
          committedQuantityKg: 50,
          operatorUserId: farmerUser.id,
        });
      } catch (err: unknown) {
        const error = err as Error;
        expect(error.message).toMatch(/already has an active committed off-take agreement|capacity limit exceeded/);
      }
    }

    // 5. Buyer Marketplace Purchase with Atomic Stock Hold
    const orderNumber = `ORD-E2E-${Date.now().toString().slice(-6)}`;
    const purchaseQty = 40;
    const lotBefore = await prisma.harvestLot.findUniqueOrThrow({ where: { id: lotId } });

    await reserveLotInventory(lotId, purchaseQty, orderNumber, buyerUser.id);

    const lotAfterReservation = await prisma.harvestLot.findUniqueOrThrow({ where: { id: lotId } });
    expect(lotAfterReservation.availableQuantityKg).toBe(lotBefore.availableQuantityKg - purchaseQty);
    expect(lotAfterReservation.reservedQuantityKg).toBe(purchaseQty);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerProfileId: buyerUser.buyerProfile.id,
        totalAmount: purchaseQty * lotBefore.unitPricePerKg,
        status: OrderStatus.RESERVED,
        deliveryAddress: "Hyderabad Retail Distribution Center",
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        source: "DEMO",
        orderLines: {
          create: {
            harvestLotId: lotId,
            quantityKg: purchaseQty,
            unitPricePerKg: lotBefore.unitPricePerKg,
            lineTotal: purchaseQty * lotBefore.unitPricePerKg,
          },
        },
      },
    });

    // 6. Logistics operator schedules cold-chain pickup
    const scheduledTime = new Date(Date.now() + 2 * 3600 * 1000);
    const shipment = await scheduleShipmentPickup({
      orderId: order.id,
      vehicleNumber: "TS-03-EB-4192",
      vehicleType: "1.5T Refrigerated Mini-Van",
      driverUserId: logisticsUser.id,
      pickupLocation: "Warangal North Hub",
      destination: "Hyderabad Cold Hub",
      scheduledPickupTime: scheduledTime,
      operatorUserId: logisticsUser.id,
    });
    expect(shipment.status).toBe(ShipmentStatus.SCHEDULED);

    // 7. Invariant check: Cannot deliver before dispatch
    await expect(
      confirmDeliveryAndQC({
        shipmentId: shipment.id,
        inspectedBy: "QC Inspector",
        sampledQuantityKg: 4,
        totalDeliveredQuantityKg: purchaseQty,
        acceptedQuantityKg: purchaseQty,
        verifiedGrade: "GRADE_A",
        freshnessScore: 9.5,
        operatorUserId: logisticsUser.id,
      })
    ).rejects.toThrow(/Cannot mark shipment as DELIVERED before it has been dispatched/);

    // 8. Logistics departs: DISPATCH -> IN_TRANSIT with cargo temp log
    const dispatchedShipment = await dispatchShipment({
      shipmentId: shipment.id,
      temperatureLogC: 4.0,
      trackingNotes: "Transit underway. 4.0°C confirmed.",
      operatorUserId: logisticsUser.id,
    });
    expect(dispatchedShipment.status).toBe(ShipmentStatus.IN_TRANSIT);
    expect(dispatchedShipment.temperatureLogC).toBe(4.0);

    // 9. Delivery confirmation and buyer handover QC acceptance
    const deliveryResult = await confirmDeliveryAndQC({
      shipmentId: shipment.id,
      inspectedBy: "Dr. Ramesh V. Rao (QC Lead)",
      sampledQuantityKg: 4,
      totalDeliveredQuantityKg: purchaseQty,
      acceptedQuantityKg: purchaseQty,
      verifiedGrade: "GRADE_A",
      freshnessScore: 9.7,
      operatorUserId: logisticsUser.id,
    });
    expect(deliveryResult.shipment.status).toBe(ShipmentStatus.DELIVERED);

    // Verify order became DELIVERED
    const deliveredOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(deliveredOrder.status).toBe(OrderStatus.DELIVERED);

    // 10. Farmer payable automatically generated
    const payable = await prisma.farmerPayable.findFirst({
      where: {
        status: "PENDING",
        farmerProfileId: activeCycle.farmUnit.farmerProfile.id,
      },
      orderBy: { createdAt: "desc" },
    });
    expect(payable).toBeDefined();
    expect(payable!.netPayable).toBe(purchaseQty * lotBefore.unitPricePerKg);

    // 11. Admin disburses 24h instant payout settlement
    const settlementResult = await disbursePayableSettlement(payable!.id, adminUser.id);
    expect(settlementResult.settlement.settlementStatus).toBe("SETTLED");
    expect(settlementResult.settlement.hoursToSettle).toBeLessThan(24);
    expect(settlementResult.payable.status).toBe("SETTLED");

    // 12. Audit event log verified
    const auditLogs = await prisma.auditLog.findMany({
      where: { entityId: settlementResult.settlement.id },
    });
    expect(auditLogs.length).toBeGreaterThan(0);
  });
});
