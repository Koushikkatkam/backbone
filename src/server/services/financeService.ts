import { prisma } from "@/lib/prisma";
import { paymentAdapter } from "../integrations";
import { logAuditEvent } from "./auditService";

export interface CalculatePayableParams {
  farmerProfileId: string;
  lotId: string;
  acceptedQuantityKg: number;
  agreedPricePerKg: number;
  deductionsAmount?: number;
  reason: string;
}

/**
 * Calculates and creates a FarmerPayable record.
 * Invariant: Payable is calculated strictly from accepted quantity * agreed price - explicit adjustments.
 */
export async function createFarmerPayable(params: CalculatePayableParams) {
  const grossAmount = Math.round(params.acceptedQuantityKg * params.agreedPricePerKg * 100) / 100;
  const deductions = params.deductionsAmount ?? 0;
  const netPayable = Math.max(0, grossAmount - deductions);

  const payableCode = `PAY-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const dueDate = new Date(Date.now() + 24 * 3600 * 1000); // 24-hr settlement commitment

  const payable = await prisma.farmerPayable.create({
    data: {
      payableCode,
      farmerProfileId: params.farmerProfileId,
      grossAmount,
      deductionsAmount: deductions,
      netPayable,
      reason: params.reason,
      status: "PENDING",
      dueDate,
    },
    include: {
      farmerProfile: {
        include: { user: true },
      },
    },
  });

  return payable;
}

/**
 * Disburses instant 24-hr settlement for a pending farmer payable.
 */
export async function disbursePayableSettlement(
  payableId: string,
  authorizedByUserId?: string
) {
  return await prisma.$transaction(async (tx) => {
    const payable = await tx.farmerPayable.findUnique({
      where: { id: payableId },
      include: {
        farmerProfile: {
          include: { user: true },
        },
        settlementRecord: true,
      },
    });

    if (!payable) throw new Error(`Payable ${payableId} not found.`);
    if (payable.status === "SETTLED" || payable.settlementRecord) {
      throw new Error(`Payable ${payable.payableCode} is already settled.`);
    }

    // Call payment adapter (Deterministic simulated provider)
    const payoutResult = await paymentAdapter.disburseInstantSettlement({
      farmerId: payable.farmerProfile.id,
      farmerName: payable.farmerProfile.user.name,
      bankAccountOrUpi: payable.farmerProfile.upiId || payable.farmerProfile.bankAccountNumber || "upi@axisbank",
      amount: payable.netPayable,
      lotReferenceCode: payable.payableCode,
    });

    // Create Settlement Record
    const settlement = await tx.settlementRecord.create({
      data: {
        settlementCode: payoutResult.settlementCode,
        farmerPayableId: payable.id,
        farmerProfileId: payable.farmerProfileId,
        payoutMethod: "INSTANT_UPI_24H",
        disbursedAmount: payoutResult.disbursedAmount,
        transactionReference: payoutResult.transactionReference,
        disbursedAt: new Date(payoutResult.disbursedAt),
        hoursToSettle: payoutResult.hoursToSettle,
        settlementStatus: "SETTLED",
        source: payoutResult.source,
      },
    });

    // Update payable status
    const updatedPayable = await tx.farmerPayable.update({
      where: { id: payable.id },
      data: { status: "SETTLED" },
    });

    await logAuditEvent(
      {
        userId: authorizedByUserId,
        action: "SETTLEMENT_DISBURSED",
        entityType: "SettlementRecord",
        entityId: settlement.id,
        previousState: "PENDING",
        newState: "SETTLED",
        reason: `Instant 24-hr payout of ₹${settlement.disbursedAmount} to ${payable.farmerProfile.user.name} via ${settlement.transactionReference}`,
      },
      tx
    );

    return {
      payable: updatedPayable,
      settlement,
    };
  });
}
