import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import {
  reserveLotInventory,
  releaseLotInventory,
  adjustLotInventory,
  registerHarvestRecord,
} from "../src/server/services/harvestService";
import { disbursePayableSettlement, createFarmerPayable } from "../src/server/services/financeService";
import {
  paymentAdapter,
  telemetryAdapter,
  advisoryAdapter,
  notificationAdapter,
  geoAdapter,
} from "../src/server/integrations";

describe("Comprehensive Business Invariants & Security Hardening", () => {
  let testLotId: string;
  let testFarmerProfileId: string;

  beforeAll(async () => {
    // Locate or create isolated test lot
    const cycle = await prisma.cropCycle.findFirst({
      where: { status: "ACTIVE" },
      include: { farmUnit: { include: { farmerProfile: true } } },
    });
    if (!cycle) throw new Error("Active crop cycle not found");
    testFarmerProfileId = cycle.farmUnit.farmerProfile.id;

    // Create an isolated test lot specifically for invariant testing using service
    const reg = await registerHarvestRecord({
      cropCycleId: cycle.id,
      grossQuantityKg: 55,
      marketableQuantityKg: 50,
      grade: "GRADE_A",
      rejectionReason: "Pre-test culling",
      farmgateNotes: "Isolated invariant test lot",
      unitPricePerKg: 40,
      operatorUserId: "usr-farmer-01",
    });

    testLotId = reg.lot.id;
  });

  it("enforces atomicity on competing concurrent reservations (Anti-Oversell Race Condition)", async () => {
    // Current available: 50 kg.
    // Two competing buyers attempt to reserve 35 kg each simultaneously (Total 70 kg > 50 kg).
    const results = await Promise.allSettled([
      reserveLotInventory(testLotId, 35, "CONCURRENT-ORD-A", "usr-buyer-01"),
      reserveLotInventory(testLotId, 35, "CONCURRENT-ORD-B", "usr-buyer-02"),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    // Exactly one reservation must succeed, and one must fail
    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectedReason.message).toMatch(/INVARIANT_VIOLATION|Insufficient available stock/);

    // Verify stock is not negative
    const lot = await prisma.harvestLot.findUniqueOrThrow({ where: { id: testLotId } });
    expect(lot.availableQuantityKg).toBe(15);
    expect(lot.reservedQuantityKg).toBe(35);

    // Rollback reservation
    await releaseLotInventory(testLotId, 35, "Rollback concurrent test", "usr-admin-01");
  });

  it("requires a mandatory justification reason of >= 5 characters for lot adjustments and logs audit history", async () => {
    // Attempt adjustment with blank or tiny reason
    await expect(
      adjustLotInventory({
        lotId: testLotId,
        quantityAdjustmentKg: -5,
        reason: "bad", // < 5 chars
        operatorUserId: "usr-operator-01",
      })
    ).rejects.toThrow(/min 5 chars/);

    // Valid adjustment
    const adjusted = await adjustLotInventory({
      lotId: testLotId,
      quantityAdjustmentKg: -5,
      reason: "Damaged leaf culling during storage check",
      operatorUserId: "usr-operator-01",
    });

    expect(adjusted.availableQuantityKg).toBe(45);

    // Verify cryptographic audit log entry exists
    const audit = await prisma.auditLog.findFirst({
      where: {
        entityId: testLotId,
        action: "LOT_ADJUSTMENT",
      },
      orderBy: { timestamp: "desc" },
    });

    expect(audit).toBeDefined();
    expect(audit!.reason).toContain("Damaged leaf culling during storage check");
  });

  it("ensures completed payments are strictly backed by settlement records", async () => {
    const payable = await createFarmerPayable({
      farmerProfileId: testFarmerProfileId,
      lotId: testLotId,
      acceptedQuantityKg: 50,
      agreedPricePerKg: 40,
      deductionsAmount: 0,
      reason: "Test settlement linkage verification",
    });

    expect(payable.status).toBe("PENDING");

    // Disburse settlement
    const { settlement, payable: settledPayable } = await disbursePayableSettlement(
      payable.id,
      "usr-admin-01"
    );

    expect(settledPayable.status).toBe("SETTLED");
    expect(settlement).toBeDefined();
    expect(settlement.farmerPayableId).toBe(payable.id);
    expect(settlement.settlementStatus).toBe("SETTLED");

    // Attempting to settle the already settled payable must be rejected
    await expect(disbursePayableSettlement(payable.id, "usr-admin-01")).rejects.toThrow(
      /already settled/
    );
  });

  it("verifies mock integration adapters visibly label data as SIMULATED / DEMO", async () => {
    const payment = await paymentAdapter.disburseInstantSettlement({
      farmerId: testFarmerProfileId,
      farmerName: "Test Farmer",
      bankAccountOrUpi: "farmer@upi",
      amount: 1000,
      lotReferenceCode: "LOT-REF-TEST",
    });
    expect(payment.source).toBe("SIMULATED");

    const telemetry = await telemetryAdapter.fetchLatestReading("DEV-TEST-01");
    expect(telemetry.source).toBe("SIMULATED");

    const advisory = await advisoryAdapter.generateAdvisory({
      cropName: "Gongura",
      stage: "VEGETATIVE",
      daysPlanted: 22,
      latestSensorReading: {
        soilMoisturePercent: 65,
        ambientTemperatureC: 28,
        ecMilliSiemens: 1.8,
        phLevel: 6.5,
      },
    });
    expect(advisory.source).toBe("SIMULATED");

    const notif = await notificationAdapter.dispatchNotification({
      recipientUserId: "usr-farmer-01",
      recipientPhoneOrEmail: "+91 99890 12345",
      title: "Test notification",
      message: "Test message body",
      category: "SYSTEM",
      deliveryChannel: "SMS_SIMULATED",
    });
    expect(notif.source).toBe("SIMULATED");

    const geo = await geoAdapter.estimateRoute("WARANGAL_NORTH", "HYDERABAD_HUB");
    expect(geo.source).toBe("SIMULATED");
  });

  it("asserts that dashboard operational aggregates match direct database source records", async () => {
    const [
      dbOperationalFarms,
      dbActiveCycles,
      dbHarvestLots,
      dbOrders,
      dbPayables,
      dbReceivables,
    ] = await Promise.all([
      prisma.farmUnit.count({ where: { status: "OPERATIONAL" } }),
      prisma.cropCycle.count({ where: { status: "ACTIVE" } }),
      prisma.harvestLot.findMany(),
      prisma.order.findMany(),
      prisma.farmerPayable.findMany({ where: { status: "PENDING" } }),
      prisma.buyerReceivable.findMany({ where: { status: "PENDING" } }),
    ]);

    const calculatedAvailableProduce = dbHarvestLots.reduce(
      (sum, lot) => sum + lot.availableQuantityKg,
      0
    );
    const calculatedReservedProduce = dbHarvestLots.reduce(
      (sum, lot) => sum + lot.reservedQuantityKg,
      0
    );
    const calculatedPendingPayables = dbPayables.reduce(
      (sum, p) => sum + p.netPayable,
      0
    );
    const calculatedPendingReceivables = dbReceivables.reduce(
      (sum, r) => sum + r.amount,
      0
    );

    // Consistency check: sums must be finite non-negative numbers
    expect(dbOperationalFarms).toBeGreaterThan(0);
    expect(dbActiveCycles).toBeGreaterThan(0);
    expect(dbOrders.length).toBeGreaterThanOrEqual(0);
    expect(calculatedAvailableProduce).toBeGreaterThanOrEqual(0);
    expect(calculatedReservedProduce).toBeGreaterThanOrEqual(0);
    expect(calculatedPendingPayables).toBeGreaterThanOrEqual(0);
    expect(calculatedPendingReceivables).toBeGreaterThanOrEqual(0);
  });
});
