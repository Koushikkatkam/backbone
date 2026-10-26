import { prisma } from "@/lib/prisma";
import { logAuditEvent } from "./auditService";

export interface ControlCommandParams {
  farmUnitId: string;
  command: "START_DRIP" | "STOP_DRIP" | "NUTRIENT_FLUSH" | "CALIBRATE_PH";
  durationMinutes?: number;
  notes?: string;
  operatorUserId?: string;
}

export interface IngestTelemetryBatchParams {
  deviceId: string;
  count?: number;
  operatorUserId?: string;
}

/**
 * Execute a simulated pump/fertigation control command.
 * Strictly simulated: updates audit logs and returns verified state change.
 */
export async function executeSimulatedControl(params: ControlCommandParams) {
  const farm = await prisma.farmUnit.findUnique({
    where: { id: params.farmUnitId },
    include: {
      sensorDevices: true,
      farmerProfile: { include: { user: true } },
    },
  });

  if (!farm) throw new Error(`Farm unit ${params.farmUnitId} not found.`);

  const duration = params.durationMinutes ?? 15;
  const commandLabels: Record<string, string> = {
    START_DRIP: `15-min Solar Precision Drip Cycle (${duration} mins)`,
    STOP_DRIP: `Emergency Drip Valve Shutdown`,
    NUTRIENT_FLUSH: `Hydroponic Root Basin EC Flush (1000L fresh RO water)`,
    CALIBRATE_PH: `Automated Nitric Acid pH Buffer Dosing (target: 6.2)`,
  };

  const label = commandLabels[params.command] || params.command;

  // Log audit event for simulation
  const audit = await logAuditEvent({
    userId: params.operatorUserId,
    action: `SIMULATED_CONTROL_${params.command}`,
    entityType: "FarmUnit",
    entityId: farm.id,
    previousState: "IDLE",
    newState: "ACTIVE_SIMULATED",
    reason: `Simulated Automation Command: ${label} on ${farm.name}. (Hardware safety isolation: active)`,
  });

  return {
    success: true,
    isSimulated: true,
    command: params.command,
    commandLabel: label,
    farmUnitId: farm.id,
    farmName: farm.name,
    executedAt: new Date().toISOString(),
    auditLogId: audit?.id,
    message: `Simulated control request executed successfully. State change logged. No physical actuator hardware contacted.`,
  };
}

/**
 * Ingest fresh simulated telemetry readings for a device.
 */
export async function ingestTelemetryBatch(params: IngestTelemetryBatchParams) {
  const device = await prisma.sensorDevice.findUnique({
    where: { id: params.deviceId },
    include: { farmUnit: true },
  });

  if (!device) throw new Error(`Sensor device ${params.deviceId} not found.`);

  const now = new Date();
  const count = params.count ?? 6;
  const created = [];

  for (let i = count - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000); // 15-min intervals
    const tempVar = Math.sin((i / 6) * Math.PI) * 2.5;

    const reading = await prisma.sensorReading.create({
      data: {
        sensorDeviceId: device.id,
        timestamp,
        soilMoisturePercent: Math.round((65.0 + ((i * 2.1) % 10)) * 10) / 10,
        ambientTemperatureC: Math.round((27.5 + tempVar) * 10) / 10,
        relativeHumidityPercent: Math.round((62.0 - tempVar * 1.2) * 10) / 10,
        ecMilliSiemens: Math.round((1.85 + (i % 2 === 0 ? 0.08 : -0.05)) * 100) / 100,
        phLevel: Math.round((6.4 + (i % 3 === 0 ? 0.1 : -0.1)) * 10) / 10,
        solarRadiationWm2: Math.max(0, Math.round(580 + Math.sin(i) * 120)),
        flowRateLpm: i % 2 === 0 ? 14.8 : 0.0,
        source: "SIMULATED",
      },
    });
    created.push(reading);
  }

  // Update device lastSeenAt
  await prisma.sensorDevice.update({
    where: { id: device.id },
    data: { lastSeenAt: now },
  });

  await logAuditEvent({
    userId: params.operatorUserId,
    action: "TELEMETRY_BATCH_INGESTED",
    entityType: "SensorDevice",
    entityId: device.id,
    newState: JSON.stringify({ count: created.length, deviceCode: device.deviceCode }),
    reason: `Generated ${created.length} simulated telemetry readings for ${device.deviceCode} (${device.farmUnit.name})`,
  });

  return {
    success: true,
    count: created.length,
    deviceCode: device.deviceCode,
  };
}
