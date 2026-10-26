import { prisma } from "@/lib/prisma";
import { advisoryAdapter } from "../integrations";
import { logAuditEvent } from "./auditService";

export interface GenerateAdvisoryParams {
  cropCycleId: string;
  category?: string;
  severity?: string;
  customContent?: string;
  customActions?: string[];
  operatorUserId?: string;
}

/**
 * Generate a precision agronomy advisory linked to a crop cycle.
 * Calls the deterministic simulated AI advisory adapter or custom inputs.
 */
export async function createCropAdvisory(params: GenerateAdvisoryParams) {
  const cycle = await prisma.cropCycle.findUnique({
    where: { id: params.cropCycleId },
    include: {
      cropCatalogue: true,
      farmUnit: {
        include: {
          farmerProfile: { include: { user: true } },
          sensorDevices: {
            include: {
              readings: { take: 1, orderBy: { timestamp: "desc" } },
            },
          },
        },
      },
    },
  });

  if (!cycle) {
    throw new Error(`Crop cycle ${params.cropCycleId} not found.`);
  }

  const latestReading = cycle.farmUnit.sensorDevices[0]?.readings[0] || {
    ecMilliSiemens: 1.85,
    phLevel: 6.4,
  };

  const daysPlanted = Math.max(
    1,
    Math.round((Date.now() - new Date(cycle.plantedDate).getTime()) / (1000 * 3600 * 24))
  );

  // Invoke adapter
  const generated = await advisoryAdapter.generateAdvisory({
    cropName: cycle.cropCatalogue.name,
    stage: cycle.stage,
    daysPlanted,
    latestSensorReading: {
      ecMilliSiemens: latestReading.ecMilliSiemens ?? 1.85,
      phLevel: latestReading.phLevel ?? 6.4,
    },
  });

  const advisory = await prisma.agronomyAdvisory.create({
    data: {
      cropCycleId: cycle.id,
      advisoryCode: `ADV-${Date.now().toString().slice(-6)}`,
      title: generated.title,
      category: params.category || generated.category,
      severity: params.severity || generated.severity,
      content: params.customContent || generated.content,
      recommendedActions: JSON.stringify(params.customActions || generated.recommendedActions),
      issuedBy: generated.issuedBy,
      source: "SIMULATED",
      isActioned: false,
    },
    include: {
      cropCycle: {
        include: {
          cropCatalogue: true,
          farmUnit: { include: { farmerProfile: { include: { user: true } } } },
        },
      },
    },
  });

  // Notify farmer
  const farmerUserId = cycle.farmUnit.farmerProfile.userId;
  await prisma.notification.create({
    data: {
      userId: farmerUserId,
      title: `New Agronomy Advisory: ${advisory.title}`,
      message: `Recommended actions issued for your ${cycle.cropCatalogue.name} cycle (${cycle.cycleCode}). Check telemetry guidelines.`,
      type: "ADVISORY",
      link: `/advisories`,
      isRead: false,
    },
  });

  await logAuditEvent({
    userId: params.operatorUserId,
    action: "ADVISORY_ISSUED",
    entityType: "AgronomyAdvisory",
    entityId: advisory.id,
    newState: JSON.stringify({ code: advisory.advisoryCode, title: advisory.title }),
    reason: `Simulated agronomy advisory generated for ${cycle.cycleCode}`,
  });

  return advisory;
}

/**
 * Farmer acknowledges or marks advisory as actioned.
 */
export async function acknowledgeAdvisory(advisoryId: string, farmerUserId?: string) {
  const advisory = await prisma.agronomyAdvisory.findUnique({
    where: { id: advisoryId },
  });

  if (!advisory) throw new Error(`Advisory ${advisoryId} not found.`);

  const updated = await prisma.agronomyAdvisory.update({
    where: { id: advisoryId },
    data: {
      isActioned: true,
      actionedAt: new Date(),
    },
  });

  await logAuditEvent({
    userId: farmerUserId,
    action: "ADVISORY_ACKNOWLEDGED",
    entityType: "AgronomyAdvisory",
    entityId: advisoryId,
    previousState: "UNACTIONED",
    newState: "ACTIONED",
    reason: `Farmer acknowledged and completed recommended field actions for ${advisory.advisoryCode}`,
  });

  return updated;
}
