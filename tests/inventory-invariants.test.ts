import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { reserveLotInventory, releaseLotInventory } from "../src/server/services/harvestService";

describe("Inventory Business Invariants", () => {
  let testLotId: string;

  beforeAll(async () => {
    // Locate a lot with available stock
    const lot = await prisma.harvestLot.findFirst({
      where: { availableQuantityKg: { gte: 30 } },
    });
    if (!lot) throw new Error("No harvest lot found with availableQuantityKg >= 30");
    testLotId = lot.id;
  });

  it("prevents overselling when requested quantity exceeds available stock", async () => {
    const lot = await prisma.harvestLot.findUnique({ where: { id: testLotId } });
    const excessiveQuantity = (lot?.availableQuantityKg ?? 0) + 5000;

    await expect(
      reserveLotInventory(testLotId, excessiveQuantity, "TEST-ORD-OVERSELL", "usr-admin-01")
    ).rejects.toThrow(/INVARIANT_VIOLATION/);
  });

  it("decrements available stock and increments reserved stock on valid reservation", async () => {
    const lotBefore = await prisma.harvestLot.findUnique({ where: { id: testLotId } });
    const reserveAmount = 25.0;

    const result = await reserveLotInventory(
      testLotId,
      reserveAmount,
      "TEST-ORD-VALID-01",
      "usr-admin-01"
    );

    expect(result.success).toBe(true);
    expect(result.reservedKg).toBe(reserveAmount);

    const lotAfter = await prisma.harvestLot.findUnique({ where: { id: testLotId } });
    expect(lotAfter?.availableQuantityKg).toBe((lotBefore?.availableQuantityKg ?? 0) - reserveAmount);
    expect(lotAfter?.reservedQuantityKg).toBe((lotBefore?.reservedQuantityKg ?? 0) + reserveAmount);

    // Rollback reservation for cleanliness
    await releaseLotInventory(testLotId, reserveAmount, "Test cleanup release", "usr-admin-01");
  });

  it("releases reserved inventory back to available pool upon cancellation", async () => {
    const lotBefore = await prisma.harvestLot.findUnique({ where: { id: testLotId } });
    const holdAmount = 15.0;

    await reserveLotInventory(testLotId, holdAmount, "TEST-HOLD-CANCEL", "usr-admin-01");
    await releaseLotInventory(testLotId, holdAmount, "Order cancellation release", "usr-admin-01");

    const lotAfter = await prisma.harvestLot.findUnique({ where: { id: testLotId } });
    expect(lotAfter?.availableQuantityKg).toBe(lotBefore?.availableQuantityKg);
    expect(lotAfter?.reservedQuantityKg).toBe(lotBefore?.reservedQuantityKg);
  });
});
