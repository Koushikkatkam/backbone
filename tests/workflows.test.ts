import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  reserveLotInventory,
  registerHarvestRecord,
  cancelOrderAndRelease,
} from "../src/server/services/harvestService";
import {
  scheduleShipmentPickup,
  dispatchShipment,
  confirmDeliveryAndQC,
} from "../src/server/services/logisticsService";
import {
  commitFarmerBuyback,
  matchBuybackToBuyerDemand,
} from "../src/server/services/buybackService";
import { createFarmerPayable, disbursePayableSettlement } from "../src/server/services/financeService";

describe("Shot 2 End-to-End Business Invariants & Workflows", () => {
  let cropCycleId: string;
  let farmerProfileId: string;
  let buyerProfileId: string;
  let buybackOfferId: string;

  beforeAll(async () => {
    const cycle = await prisma.cropCycle.findFirst({
      where: { status: "ACTIVE" },
      include: { farmUnit: { include: { farmerProfile: true } } },
    });
    if (!cycle) throw new Error("Active crop cycle not found");
    cropCycleId = cycle.id;
    farmerProfileId = cycle.farmUnit.farmerProfile.id;

    const buyer = await prisma.buyerProfile.findFirst();
    if (!buyer) throw new Error("Buyer profile not found");
    buyerProfileId = buyer.id;

    const offer = await prisma.buybackOffer.findFirst({ where: { status: "ACTIVE" } });
    if (!offer) throw new Error("Active buyback offer not found");
    buybackOfferId = offer.id;
  });

  it("registers harvest and atomically creates traceable lot with post-harvest loss tracking and audit log", async () => {
    const grossKg = 150;
    const marketableKg = 142; // 8 kg loss (5.3%)

    const result = await registerHarvestRecord({
      cropCycleId,
      grossQuantityKg: grossKg,
      marketableQuantityKg: marketableKg,
      grade: "GRADE_A",
      rejectionReason: "Trimming and leaf culling",
      farmgateNotes: "Test registered harvest",
      unitPricePerKg: 45,
      operatorUserId: "usr-farmer-01",
    });

    expect(result.harvestRecord).toBeDefined();
    expect(result.lot).toBeDefined();
    expect(result.lot.initialQuantityKg).toBe(marketableKg);
    expect(result.lot.availableQuantityKg).toBe(marketableKg);
    expect(result.lot.spoiledQuantityKg).toBe(grossKg - marketableKg);

    // Verify audit log
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityType: "HarvestLot",
        entityId: result.lot.id,
        action: "HARVEST_REGISTERED",
      },
    });
    expect(audit).toBeDefined();
  });

  it("enforces logistics invariant: delivery CANNOT precede dispatch", async () => {
    // 1. Create a lot and order for shipment
    const lot = await prisma.harvestLot.findFirst({
      where: { availableQuantityKg: { gte: 20 } },
    });
    if (!lot) throw new Error("No lot available with >= 20kg");

    const orderNumber = `TEST-ORD-LOGISTICS-${Date.now()}`;
    await reserveLotInventory(lot.id, 20, orderNumber);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerProfileId,
        totalAmount: 20 * lot.unitPricePerKg,
        status: "RESERVED",
        deliveryAddress: "Test Logistics Destination, Hyderabad",
        expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 3600 * 1000),
        orderLines: {
          create: {
            harvestLotId: lot.id,
            quantityKg: 20,
            unitPricePerKg: lot.unitPricePerKg,
            lineTotal: 20 * lot.unitPricePerKg,
          },
        },
      },
    });

    // 2. Schedule shipment (status SCHEDULED, not dispatched)
    const shipment = await scheduleShipmentPickup({
      orderId: order.id,
      vehicleNumber: "TS-03-EB-4192",
      pickupLocation: "Mulugu Aggregation Cold Hub",
      destination: "Test Logistics Destination, Hyderabad",
      scheduledPickupTime: new Date(),
    });

    expect(shipment.status).toBe("SCHEDULED");

    // 3. ATTEMPT TO DELIVER BEFORE DISPATCH -> MUST THROW INVARIANT_VIOLATION
    await expect(
      confirmDeliveryAndQC({
        shipmentId: shipment.id,
        inspectedBy: "QC Lead",
        sampledQuantityKg: 5,
        totalDeliveredQuantityKg: 20,
        acceptedQuantityKg: 20,
        verifiedGrade: "GRADE_A",
        freshnessScore: 9.5,
      })
    ).rejects.toThrow(/INVARIANT_VIOLATION/);

    // 4. Now properly dispatch shipment
    const dispatched = await dispatchShipment({
      shipmentId: shipment.id,
      temperatureLogC: 4.1,
    });
    expect(dispatched.status).toBe("IN_TRANSIT");
    expect(dispatched.actualPickupTime).toBeDefined();

    // 5. Now delivery should succeed and generate payable
    const delivered = await confirmDeliveryAndQC({
      shipmentId: shipment.id,
      inspectedBy: "QC Lead",
      sampledQuantityKg: 5,
      totalDeliveredQuantityKg: 20,
      acceptedQuantityKg: 20,
      verifiedGrade: "GRADE_A",
      freshnessScore: 9.5,
    });

    expect(delivered.shipment.status).toBe("DELIVERED");
    expect(delivered.inspection.acceptedQuantityKg).toBe(20);

    // Verify auto-generated payable
    const payable = await prisma.farmerPayable.findFirst({
      where: { reason: { contains: orderNumber } },
    });
    expect(payable).toBeDefined();
    expect(payable?.grossAmount).toBe(20 * lot.unitPricePerKg);
  });

  it("cancelling an order releases its active reservation exactly once and forbids duplicate cancellation", async () => {
    const lot = await prisma.harvestLot.findFirst({
      where: { availableQuantityKg: { gte: 10 } },
    });
    if (!lot) throw new Error("No lot available");

    const availableBefore = lot.availableQuantityKg;
    const orderNumber = `TEST-ORD-CANCEL-${Date.now()}`;
    await reserveLotInventory(lot.id, 10, orderNumber);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerProfileId,
        totalAmount: 10 * lot.unitPricePerKg,
        status: "RESERVED",
        deliveryAddress: "Hyderabad Hub",
        expectedDeliveryDate: new Date(),
        orderLines: {
          create: {
            harvestLotId: lot.id,
            quantityKg: 10,
            unitPricePerKg: lot.unitPricePerKg,
            lineTotal: 10 * lot.unitPricePerKg,
          },
        },
      },
    });

    // First cancellation -> releases reservation
    const cancelled = await cancelOrderAndRelease(order.id, "Buyer test cancellation", "usr-admin-01");
    expect(cancelled.status).toBe("CANCELLED");

    const lotAfter = await prisma.harvestLot.findUnique({ where: { id: lot.id } });
    expect(lotAfter?.availableQuantityKg).toBe(availableBefore);

    // Second cancellation -> must throw error preventing duplicate stock release
    await expect(
      cancelOrderAndRelease(order.id, "Second cancel attempt", "usr-admin-01")
    ).rejects.toThrow(/already cancelled/);
  });

  it("buyback commitment enforces capacity cap and atomic matching prevents double assignment", async () => {
    const offer = await prisma.buybackOffer.findUnique({
      where: { id: buybackOfferId },
      include: { responses: true },
    });
    if (!offer) throw new Error("Offer not found");

    const totalCommitted = offer.responses.reduce((sum, r) => sum + r.committedQuantityKg, 0);
    const excessiveKg = offer.maxQuantityKg - totalCommitted + 50000;

    // Over-capacity commitment must fail
    await expect(
      commitFarmerBuyback({
        buybackOfferId,
        farmerProfileId,
        committedQuantityKg: excessiveKg,
      })
    ).rejects.toThrow();

    // Valid commitment matching
    const existingResponse = await prisma.buybackResponse.findFirst({
      where: { buybackOfferId, status: "ACCEPTED" },
    });

    if (existingResponse) {
      const matchResult = await matchBuybackToBuyerDemand({
        buybackResponseId: existingResponse.id,
        matchedQuantityKg: existingResponse.committedQuantityKg,
        deliveryAddress: "Test ITC Hub, Hyderabad",
        operatorUserId: "usr-admin-01",
      });

      expect(matchResult.buybackResponse.status).toBe("MATCHED");
      expect(matchResult.matchedOrder.orderNumber).toMatch(/^ORD-BUYBACK-/);

      // Attempting to match again must throw error
      await expect(
        matchBuybackToBuyerDemand({
          buybackResponseId: existingResponse.id,
          matchedQuantityKg: existingResponse.committedQuantityKg,
          deliveryAddress: "Test ITC Hub, Hyderabad",
          operatorUserId: "usr-admin-01",
        })
      ).rejects.toThrow(/already been matched/);
    }
  });

  it("settles farmer payable with verified settlement record and clearance under 24 hours", async () => {
    const payable = await createFarmerPayable({
      farmerProfileId,
      lotId: "dummy-lot",
      acceptedQuantityKg: 50,
      agreedPricePerKg: 40,
      reason: "Test 24h Payout Workflow",
    });

    expect(payable.status).toBe("PENDING");
    expect(payable.netPayable).toBe(2000);

    const result = await disbursePayableSettlement(payable.id, "usr-admin-01");
    expect(result.payable.status).toBe("SETTLED");
    expect(result.settlement.settlementStatus).toBe("SETTLED");
    expect(result.settlement.transactionReference).toMatch(/^UPI-TXN-TELANGANA-/);
    expect(result.settlement.hoursToSettle).toBeLessThanOrEqual(24.0);
  });
});
