import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./auditService";

export interface CommitBuybackParams {
  buybackOfferId: string;
  farmerProfileId: string;
  committedQuantityKg: number;
  operatorUserId?: string;
}

export interface MatchBuybackDemandParams {
  buybackResponseId: string;
  buyerProfileId?: string;
  matchedQuantityKg: number;
  deliveryAddress: string;
  operatorUserId?: string;
}

/**
 * Farmer accepts and commits a quantity to a buyback agreement.
 * Invariant: Cannot commit above the offer's remaining capacity, and prevents double commitment.
 */
export async function commitFarmerBuyback(params: CommitBuybackParams) {
  return await prisma.$transaction(async (tx) => {
    const offer = await tx.buybackOffer.findUnique({
      where: { id: params.buybackOfferId },
      include: {
        responses: true,
        cropCatalogue: true,
      },
    });

    if (!offer) {
      throw new Error(`Buyback offer ${params.buybackOfferId} not found.`);
    }

    if (offer.status !== "ACTIVE") {
      throw new Error(`Buyback offer ${offer.offerCode} is currently ${offer.status} and not accepting off-take commitments.`);
    }

    if (params.committedQuantityKg <= 0) {
      throw new Error("Committed quantity must be greater than zero.");
    }

    // Check total committed so far
    const totalCommitted = offer.responses.reduce((sum, r) => sum + r.committedQuantityKg, 0);
    const remainingCapacity = offer.maxQuantityKg - totalCommitted;

    if (params.committedQuantityKg > remainingCapacity) {
      throw new Error(
        `Requested commitment (${params.committedQuantityKg} kg) exceeds remaining capacity (${remainingCapacity} kg) for offer ${offer.offerCode}.`
      );
    }

    // Check if farmer already has an active commitment on this offer
    const existing = await tx.buybackResponse.findFirst({
      where: {
        buybackOfferId: params.buybackOfferId,
        farmerProfileId: params.farmerProfileId,
        status: { in: ["ACCEPTED", "COMMITTED"] },
      },
    });

    if (existing) {
      throw new Error(
        `Farmer already has an active committed off-take agreement (${existing.committedQuantityKg} kg) for offer ${offer.offerCode}. Double commitment prohibited.`
      );
    }

    const response = await tx.buybackResponse.create({
      data: {
        buybackOfferId: params.buybackOfferId,
        farmerProfileId: params.farmerProfileId,
        committedQuantityKg: params.committedQuantityKg,
        status: "ACCEPTED",
        signedDate: new Date(),
      },
      include: {
        farmerProfile: { include: { user: true } },
        buybackOffer: { include: { cropCatalogue: true } },
      },
    });

    await logAuditEvent(
      {
        userId: params.operatorUserId,
        action: "BUYBACK_COMMITTED",
        entityType: "BuybackResponse",
        entityId: response.id,
        newState: JSON.stringify({ committedKg: params.committedQuantityKg, offer: offer.offerCode }),
        reason: `Farmer ${response.farmerProfile.user.name} committed ${params.committedQuantityKg} kg to offer ${offer.offerCode}`,
      },
      tx
    );

    return response;
  });
}

/**
 * Match or transfer committed buyback quantity to buyer demand through an atomic business operation.
 * Prevents double counting or duplicate reservations.
 */
export async function matchBuybackToBuyerDemand(params: MatchBuybackDemandParams) {
  return await prisma.$transaction(async (tx) => {
    const response = await tx.buybackResponse.findUnique({
      where: { id: params.buybackResponseId },
      include: {
        buybackOffer: { include: { cropCatalogue: true } },
        farmerProfile: {
          include: {
            user: true,
            farmUnits: {
              include: {
                cropCycles: {
                  where: { status: "ACTIVE" },
                  include: { cropCatalogue: true, harvestRecords: { include: { lots: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!response) {
      throw new Error(`Buyback commitment ${params.buybackResponseId} not found.`);
    }

    if (response.status === "MATCHED" || response.status === "TRANSFERRED") {
      throw new Error(`Buyback commitment has already been matched to buyer demand.`);
    }

    if (params.matchedQuantityKg <= 0 || params.matchedQuantityKg > response.committedQuantityKg) {
      throw new Error(
        `Matched quantity (${params.matchedQuantityKg} kg) must be positive and cannot exceed committed quantity (${response.committedQuantityKg} kg).`
      );
    }

    // Determine buyer profile
    let buyer = await tx.buyerProfile.findFirst({
      where: params.buyerProfileId ? { id: params.buyerProfileId } : {},
    });

    if (!buyer) {
      // Find default enterprise buyer
      buyer = await tx.buyerProfile.findFirst();
      if (!buyer) {
        throw new Error("No buyer profile found to match buyback commitment.");
      }
    }

    const orderNumber = `ORD-BUYBACK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const unitPrice = response.buybackOffer.guaranteedPricePerKg + response.buybackOffer.bonusGradeAPerKg;
    const totalAmount = Math.round(params.matchedQuantityKg * unitPrice * 100) / 100;

    // Update response status to MATCHED
    const updatedResponse = await tx.buybackResponse.update({
      where: { id: response.id },
      data: { status: "MATCHED" },
    });

    // Look for an available harvest lot for this farmer and crop to atomically link and reserve
    let matchedLotId: string | null = null;
    for (const farm of response.farmerProfile.farmUnits) {
      for (const cycle of farm.cropCycles) {
        if (cycle.cropCatalogueId === response.buybackOffer.cropCatalogueId) {
          for (const hr of cycle.harvestRecords) {
            const availableLot = hr.lots.find((l) => l.availableQuantityKg >= params.matchedQuantityKg);
            if (availableLot) {
              matchedLotId = availableLot.id;
              break;
            }
          }
        }
        if (matchedLotId) break;
      }
      if (matchedLotId) break;
    }

    // Fallback: If farmer's direct lot not found, look for any available lot of this crop catalogue
    if (!matchedLotId) {
      const anyLot = await tx.harvestLot.findFirst({
        where: {
          availableQuantityKg: { gte: params.matchedQuantityKg },
          harvestRecord: response.buybackOffer.cropCatalogueId
            ? { cropCycle: { cropCatalogueId: response.buybackOffer.cropCatalogueId } }
            : undefined,
        },
      });
      if (anyLot) matchedLotId = anyLot.id;
    }

    // Atomically reserve inventory if lot is available
    if (matchedLotId) {
      await tx.harvestLot.update({
        where: { id: matchedLotId },
        data: {
          availableQuantityKg: { decrement: params.matchedQuantityKg },
          reservedQuantityKg: { increment: params.matchedQuantityKg },
        },
      });
    }

    // Create matched B2B Order with orderLine
    const order = await tx.order.create({
      data: {
        orderNumber,
        buyerProfileId: buyer.id,
        totalAmount,
        status: "CONFIRMED",
        deliveryAddress: params.deliveryAddress || buyer.deliveryAddress,
        expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 3600 * 1000),
        notes: `Matched from Guaranteed Buyback Agreement ${response.buybackOffer.offerCode} (${response.farmerProfile.user.name})`,
        source: "DEMO",
        orderLines: matchedLotId
          ? {
              create: {
                harvestLotId: matchedLotId,
                quantityKg: params.matchedQuantityKg,
                unitPricePerKg: unitPrice,
                lineTotal: totalAmount,
              },
            }
          : undefined,
      },
      include: {
        orderLines: true,
      },
    });

    await logAuditEvent(
      {
        userId: params.operatorUserId,
        action: "BUYBACK_MATCHED_TO_DEMAND",
        entityType: "BuybackResponse",
        entityId: response.id,
        previousState: "ACCEPTED",
        newState: "MATCHED",
        reason: `Matched ${params.matchedQuantityKg} kg from agreement ${response.buybackOffer.offerCode} to Order ${orderNumber} for ${buyer.companyName}`,
      },
      tx
    );

    return {
      buybackResponse: updatedResponse,
      matchedOrder: order,
    };
  });
}
