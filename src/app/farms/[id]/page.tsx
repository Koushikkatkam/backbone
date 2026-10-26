/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FarmActions } from "@/components/farms/FarmActions";
import {
  ArrowLeft,
  User,
  Cpu,
  Sprout,
  Activity,
  MapPin,
  CheckCircle2,
  Wrench,
  Sun,
  Droplets,
} from "lucide-react";

export default async function FarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let farm: any = null;
  try {
    farm = await prisma.farmUnit.findFirst({
      where: { OR: [{ id }, { farmCode: id }] },
      include: {
        farmerProfile: {
          include: { user: true },
        },
        installations: true,
        maintenanceLogs: {
          orderBy: { performedAt: "desc" },
        },
        cropCycles: {
          include: {
            cropCatalogue: true,
            growthObservations: true,
            advisories: true,
          },
          orderBy: { plantedDate: "desc" },
        },
        sensorDevices: {
          include: {
            readings: {
              take: 12,
              orderBy: { timestamp: "desc" },
            },
            alerts: true,
          },
        },
      },
    });
  } catch (err) {
    console.warn("Database unavailable in FarmDetailPage, using fallback:", err);
  }

  if (!farm) {
    const { FALLBACK_FARM_UNITS } = await import("@/server/fallbackData");
    farm = FALLBACK_FARM_UNITS.find((f) => f.id === id || f.farmCode === id) || FALLBACK_FARM_UNITS[0];
  }

  if (!farm) notFound();

  const installation = farm.installations?.[0];
  const activeCycle = (farm.cropCycles || []).find((c: any) => c.status === "ACTIVE") || farm.cropCycles?.[0];
  const sensor = farm.sensorDevices?.[0];

  return (
    <AppShell>
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/farms"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Farm Units</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-300">
                {farm.farmCode}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
                {farm.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{farm.locationAddress}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={farm.tier} />
            <FarmActions
              farmId={farm.id}
              farmName={farm.name}
              activeCycle={
                activeCycle
                  ? {
                      id: activeCycle.id,
                      stage: activeCycle.stage,
                      cropName: activeCycle.cropCatalogue.name,
                    }
                  : null
              }
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Infrastructure Specs & Active Cycles */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infrastructure Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>Installed Infrastructure Specifications</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {installation ? (
                <div>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed bg-[#F8F9F6] p-3.5 rounded-lg border border-[#E2E8E0]">
                    {installation.specifications}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5 text-amber-500" />
                        Solar Capacity
                      </span>
                      <p className="text-base font-bold text-[#0F1D2F] mt-1">{installation.solarCapacityKw} kW</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Droplets className="w-3.5 h-3.5 text-sky-500" />
                        Water Reservoir
                      </span>
                      <p className="text-base font-bold text-[#0F1D2F] mt-1">{installation.waterTankCapacityLiters.toLocaleString()} Liters</p>
                    </div>
                    <div className="p-3 bg-white rounded-lg border border-slate-200">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Health Status
                      </span>
                      <p className="text-base font-bold text-emerald-700 mt-1">{installation.status}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No installation records recorded.</p>
              )}
            </CardContent>
          </Card>

          {/* Active & Historical Crop Cycles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Crop Cycles on this Unit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E2E8E0]">
                {(farm.cropCycles || []).map((cycle: any) => (
                  <div key={cycle.id} className="p-5 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-800">{cycle.cycleCode}</span>
                        <h4 className="text-sm font-bold text-[#0F1D2F] mt-0.5">
                          {cycle.cropCatalogue.name} ({cycle.cropCatalogue.variety})
                        </h4>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Stage: {cycle.stage}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Planted Date</span>
                        <span className="font-semibold text-slate-800">{(cycle.plantedDate instanceof Date ? cycle.plantedDate : new Date(cycle.plantedDate)).toISOString().slice(0, 10)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Expected Harvest</span>
                        <span className="font-semibold text-slate-800">{(cycle.expectedHarvestDate instanceof Date ? cycle.expectedHarvestDate : new Date(cycle.expectedHarvestDate)).toISOString().slice(0, 10)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Target Yield</span>
                        <span className="font-semibold text-slate-800">{cycle.targetYieldKg} kg</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Health Status</span>
                        <StatusBadge status={cycle.healthStatus} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Maintenance Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-slate-600" />
                <span>Maintenance &amp; Inspection History</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-3">
              {(farm.maintenanceLogs || []).map((log: any) => (
                <div key={log.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#0F1D2F]">{log.category}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{(log.performedAt instanceof Date ? log.performedAt : new Date(log.performedAt)).toISOString().slice(0, 10)}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.description}</p>
                  <p className="text-[11px] text-slate-500 mt-2 font-medium">
                    Technician: {log.performedBy} &bull; Cost: ₹{log.cost}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): Farmer Identity & Live Sensor Fleet */}
        <div className="space-y-6">
          {/* Farmer Profile Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <span>Smallholder Farmer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-full bg-[#1B532D] text-white flex items-center justify-center font-bold text-sm">
                  {farm.farmerProfile.user.name.split(" ").map((n: string) => n[0]).join("")}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#0F1D2F]">{farm.farmerProfile.user.name}</h4>
                  <p className="text-slate-500">{farm.farmerProfile.farmerCode}</p>
                </div>
              </div>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-slate-800">{farm.farmerProfile.user.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Village:</span>
                  <span className="text-slate-800">{farm.farmerProfile.village}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Mandal &amp; Dist:</span>
                  <span className="text-slate-800">{farm.farmerProfile.mandal}, {farm.farmerProfile.district}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">UPI Payout VPA:</span>
                  <span className="font-mono text-emerald-800 font-semibold">{farm.farmerProfile.upiId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">KYC Status:</span>
                  <span className="text-emerald-700 font-semibold">{farm.farmerProfile.kycStatus}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sensor Device Data Stream */}
          {sensor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>IoT Telemetry Node</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono font-bold text-slate-800">{sensor.deviceCode}</span>
                  <StatusBadge status={sensor.status} />
                </div>
                <div className="text-slate-600 space-y-1 text-[11px]">
                  <p>Protocol: <span className="font-mono font-semibold text-slate-800">{sensor.protocol}</span></p>
                  <p>Model: <span className="text-slate-800">{sensor.model}</span></p>
                  <p>Battery: <span className="text-slate-800 font-bold">{sensor.batteryLevel}%</span></p>
                  <p>Signal: <span className="font-mono text-slate-800">{sensor.signalStrengthDbm} dBm</span></p>
                </div>

                <div className="pt-2">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-2">
                    Recent Readings (Simulated Stream)
                  </span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(sensor?.readings || []).map((r: any) => (
                      <div
                        key={r.id}
                        className="p-2 bg-slate-50 rounded border border-slate-200 text-[10px] flex items-center justify-between font-mono"
                      >
                        <span className="text-slate-500">{new Date(r.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-slate-700">M: {r.soilMoisturePercent?.toFixed(1)}%</span>
                        <span className="text-emerald-800 font-semibold">EC: {r.ecMilliSiemens?.toFixed(2)}</span>
                        <span className="text-amber-800 font-semibold">pH: {r.phLevel?.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
