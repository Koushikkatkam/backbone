import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { telemetryAdapter } from "@/server/integrations";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceCode = searchParams.get("deviceCode");

    if (deviceCode) {
      const device = await prisma.sensorDevice.findUnique({
        where: { deviceCode },
        include: {
          farmUnit: true,
          readings: {
            orderBy: { timestamp: "desc" },
            take: 24,
          },
          alerts: {
            orderBy: { triggeredAt: "desc" },
          },
        },
      });

      if (!device) {
        return NextResponse.json({ success: false, error: "Device not found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, device });
    }

    const devices = await prisma.sensorDevice.findMany({
      include: {
        farmUnit: {
          include: {
            farmerProfile: {
              include: { user: true },
            },
          },
        },
        readings: {
          orderBy: { timestamp: "desc" },
          take: 1,
        },
        alerts: {
          where: { isResolved: false },
        },
      },
      orderBy: { deviceCode: "asc" },
    });

    return NextResponse.json({
      success: true,
      count: devices.length,
      devices,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch telemetry";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceCode } = body;

    if (!deviceCode) {
      return NextResponse.json({ success: false, error: "deviceCode is required" }, { status: 400 });
    }

    const device = await prisma.sensorDevice.findUnique({ where: { deviceCode } });
    if (!device) {
      return NextResponse.json({ success: false, error: "Sensor device not found" }, { status: 404 });
    }

    const sim = await telemetryAdapter.fetchLatestReading(deviceCode);

    const newReading = await prisma.sensorReading.create({
      data: {
        sensorDeviceId: device.id,
        timestamp: new Date(sim.timestamp),
        soilMoisturePercent: sim.soilMoisturePercent,
        ambientTemperatureC: sim.ambientTemperatureC,
        relativeHumidityPercent: sim.relativeHumidityPercent,
        ecMilliSiemens: sim.ecMilliSiemens,
        phLevel: sim.phLevel,
        solarRadiationWm2: sim.solarRadiationWm2,
        flowRateLpm: sim.flowRateLpm,
        source: sim.source,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Simulated telemetry point ingested for ${deviceCode}`,
      reading: newReading,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to ingest telemetry";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
