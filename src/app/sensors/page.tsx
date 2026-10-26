/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { Activity, AlertTriangle, Battery, Droplets } from "lucide-react";
import { TelemetryVisualizer } from "@/components/sensors/TelemetryVisualizer";

export default async function SensorsPage() {
  let devices: any[] = [];
  let alerts: any[] = [];
  let allFarms: any[] = [];

  try {
    const results = await Promise.all([
      prisma.sensorDevice.findMany({
        include: {
          farmUnit: {
            include: { farmerProfile: { include: { user: true } } },
          },
          readings: {
            take: 24,
            orderBy: { timestamp: "asc" },
          },
        },
        orderBy: { deviceCode: "asc" },
      }),
      prisma.sensorAlert.findMany({
        include: {
          sensorDevice: {
            include: { farmUnit: true },
          },
        },
        orderBy: { triggeredAt: "desc" },
      }),
      prisma.farmUnit.findMany({
        select: { id: true, name: true },
        orderBy: { farmCode: "asc" },
      }),
    ]);
    devices = results[0];
    alerts = results[1];
    allFarms = results[2];
  } catch (err) {
    console.warn("Database unavailable in SensorsPage, using fallback telemetry:", err);
  }

  if (devices.length === 0) {
    const { FALLBACK_ALERTS } = await import("@/server/fallbackData");
    devices = [
      {
        id: "dev-01",
        deviceCode: "SENS-WGL-01-A",
        status: "ONLINE",
        batteryLevel: 94.5,
        farmUnit: { name: "Mallesham Hydroponic Unit 1", farmerProfile: { user: { name: "Mallesham Goud" } } },
        readings: [
          {
            timestamp: new Date(),
            soilMoisturePercent: 68.4,
            ambientTemperatureC: 28.2,
            relativeHumidityPercent: 71.0,
            ecMilliSiemens: 1.82,
            phLevel: 6.4,
            solarRadiationWm2: 680,
            flowRateLpm: 14.2,
          },
        ],
      },
    ];
    alerts = FALLBACK_ALERTS;
    allFarms = [{ id: "farm-unit-01", name: "Mallesham Hydroponic Unit 1" }];
  }

  const primaryDevice = devices[0];
  const chartReadings = primaryDevice
    ? (primaryDevice.readings || []).map((r: any) => ({
        id: r.id,
        timestamp: (r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp)).toISOString(),
        timeLabel: (r.timestamp instanceof Date ? r.timestamp : new Date(r.timestamp)).toISOString().slice(11, 16),
        soilMoisturePercent: r.soilMoisturePercent,
        ambientTemperatureC: r.ambientTemperatureC,
        relativeHumidityPercent: r.relativeHumidityPercent,
        ecMilliSiemens: r.ecMilliSiemens,
        phLevel: r.phLevel,
      }))
    : [];

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            IoT Sensors &amp; Microclimate Telemetry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulated ESP32 and LoRaWAN field telemetry nodes across 10 pilot farms in Warangal &amp; Mulugu.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Active IoT Nodes"
          value={devices.length}
          subValue="ESP32-S3 Pro (LoRa 865)"
          trendText="100% network reach"
          trendDirection="up"
          icon={Activity}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />

        <StatCard
          title="Average Battery"
          value="94.2%"
          subValue="Solar rechargeable"
          trendText="Zero low-power warnings"
          trendDirection="up"
          icon={Battery}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-700"
        />

        <StatCard
          title="Optimal EC Range"
          value="1.8 - 2.2"
          subValue="mS/cm target"
          trendText="Closed loop dosing"
          trendDirection="neutral"
          icon={Droplets}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-700"
        />

        <StatCard
          title="Active Threshold Alerts"
          value={alerts.filter((a) => !a.isResolved).length}
          subValue="Nutrient warning active"
          trendText="Flush recommended"
          trendDirection="down"
          icon={AlertTriangle}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
        />
      </div>

      {/* Interactive Visualizer & Simulated Control Panel */}
      {primaryDevice && (
        <div className="mb-8">
          <TelemetryVisualizer
            device={{
              id: primaryDevice.id,
              deviceCode: primaryDevice.deviceCode,
              farmName: primaryDevice.farmUnit.name,
              farmUnitId: primaryDevice.farmUnitId,
              model: primaryDevice.model,
              batteryLevel: primaryDevice.batteryLevel,
              status: primaryDevice.status,
            }}
            readings={chartReadings}
            allFarms={allFarms}
          />
        </div>
      )}

      {/* Active Alerts Callout */}
      {alerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
            Active Telemetry Threshold Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-900">{alert.parameter} Alert</span>
                      <StatusBadge status={alert.severity} />
                      <span className="text-[11px] font-mono text-slate-500">
                        {alert.sensorDevice.farmUnit.name}
                      </span>
                    </div>
                    <p className="text-amber-800 mt-1">{alert.message}</p>
                    <p className="text-[11px] text-amber-700 mt-2 font-mono">
                      Current Value: {alert.currentValue} &bull; Safe Threshold: {alert.thresholdValue}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 text-[10px]">
                  {alert.source}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sensor Fleet Grid */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Deployed Telemetry Nodes (10 Farms)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {devices.map((d) => {
            const latest = d.readings[d.readings.length - 1];
            return (
              <Card key={d.id} hoverEffect>
                <CardHeader className="bg-slate-50/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{d.deviceCode}</span>
                      <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                        {d.source}
                      </span>
                    </div>
                    <CardTitle className="mt-1 text-base text-[#0F1D2F]">{d.farmUnit.name}</CardTitle>
                    <p className="text-xs text-slate-500">
                      Farmer: {d.farmUnit.farmerProfile.user.name} ({d.farmUnit.farmerProfile.district})
                    </p>
                  </div>
                  <StatusBadge status={d.status} />
                </CardHeader>

                <CardContent className="space-y-4 pt-4 text-xs">
                  {latest ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F8F9F6] p-3 rounded-lg border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Moisture</span>
                        <span className="text-sm font-bold text-emerald-800">{latest.soilMoisturePercent}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Temp</span>
                        <span className="text-sm font-bold text-sky-800">{latest.ambientTemperatureC}°C</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">EC</span>
                        <span className="text-sm font-bold text-amber-800">{latest.ecMilliSiemens} mS/cm</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">pH</span>
                        <span className="text-sm font-bold text-purple-800">{latest.phLevel}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 text-center text-xs italic">
                      Sensor node provisioned &bull; Awaiting initial field telemetry sync.
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Protocol: {d.protocol}</span>
                    <span>Last Synced: {d.lastSeenAt ? (d.lastSeenAt instanceof Date ? d.lastSeenAt : new Date(d.lastSeenAt)).toISOString().slice(11, 16) : "--:--"} UTC</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
