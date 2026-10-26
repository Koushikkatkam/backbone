import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { createFarmerPayable, disbursePayableSettlement } from "../src/server/services/financeService";

describe("Financial Settlement Invariants", () => {
  let farmerProfileId: string;

  beforeAll(async () => {
    const farmer = await prisma.farmerProfile.findFirst({
      where: { farmerCode: "FARMER-WGL-001" },
    });
    if (!farmer) throw new Error("Seed farmer FARMER-WGL-001 not found");
    farmerProfileId = farmer.id;
  });

  it("calculates payable gross amount strictly as acceptedQuantity * agreedPrice minus explicit deductions", async () => {
    const acceptedKg = 250.0;
    const agreedPrice = 42.0;
    const deduction = 500.0; // packaging fee

    const payable = await createFarmerPayable({
      farmerProfileId,
      lotId: "dummy-lot-test",
      acceptedQuantityKg: acceptedKg,
      agreedPricePerKg: agreedPrice,
      deductionsAmount: deduction,
      reason: "Test invariant batch calculation",
    });

    const expectedGross = 250.0 * 42.0; // 10500.0
    const expectedNet = expectedGross - deduction; // 10000.0

    expect(payable.grossAmount).toBe(expectedGross);
    expect(payable.deductionsAmount).toBe(deduction);
    expect(payable.netPayable).toBe(expectedNet);
    expect(payable.status).toBe("PENDING");

    // Clean up test payable
    await prisma.farmerPayable.delete({ where: { id: payable.id } });
  });

  it("disburses instant settlement with verifiable transaction reference and sub-24h record", async () => {
    const payable = await createFarmerPayable({
      farmerProfileId,
      lotId: "dummy-lot-test-disburse",
      acceptedQuantityKg: 100.0,
      agreedPricePerKg: 35.0,
      deductionsAmount: 0.0,
      reason: "Test payout disbursal execution",
    });

    const result = await disbursePayableSettlement(payable.id, "usr-admin-01");

    expect(result.payable.status).toBe("SETTLED");
    expect(result.settlement.settlementStatus).toBe("SETTLED");
    expect(result.settlement.disbursedAmount).toBe(3500.0);
    expect(result.settlement.hoursToSettle).toBeLessThanOrEqual(24.0);
    expect(result.settlement.transactionReference).toContain("UPI-TXN-TELANGANA");
    expect(result.settlement.source).toBe("SIMULATED");

    // Clean up
    await prisma.settlementRecord.delete({ where: { id: result.settlement.id } });
    await prisma.farmerPayable.delete({ where: { id: payable.id } });
  });
});
