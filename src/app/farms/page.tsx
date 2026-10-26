import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { InfrastructureTier, Prisma } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import Link from "next/link";
import { ArrowRight, Sprout, Activity } from "lucide-react";

export default async function FarmsPage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string; district?: string }>;
}) {
  const params = await searchParams;
  const tierFilter = params.tier;
  const districtFilter = params.district;

  const whereClause: Prisma.FarmUnitWhereInput = {};
  if (tierFilter) whereClause.tier = tierFilter as InfrastructureTier;
  if (districtFilter) whereClause.farmerProfile = { district: districtFilter };

  const farms = await prisma.farmUnit.findMany({
    where: whereClause,
    include: {
      farmerProfile: {
        include: { user: true },
      },
      installations: true,
      cropCycles: {
        include: { cropCatalogue: true },
        where: { status: "ACTIVE" },
      },
      sensorDevices: {
        include: {
          readings: { take: 1, orderBy: { timestamp: "desc" } },
          alerts: { where: { isResolved: false } },
        },
      },
    },
    orderBy: { farmCode: "asc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Farm Units &amp; Farmer Registry
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            10 smallholder pilot plots (0.25 acres each) across Warangal and Mulugu districts, Telangana.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/farms"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
              !tierFilter ? "bg-[#0F1D2F] text-white border-[#0F1D2F]" : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            All Tiers (10)
          </Link>
          <Link
            href="/farms?tier=VERTICAL_HYDROPONIC_A_FRAME"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
              tierFilter === "VERTICAL_HYDROPONIC_A_FRAME"
                ? "bg-[#1B532D] text-white border-[#1B532D]"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            A-Frame Hydroponics
          </Link>
          <Link
            href="/farms?tier=SEMI_CLOSED_POLY_CANOPY"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
              tierFilter === "SEMI_CLOSED_POLY_CANOPY"
                ? "bg-teal-800 text-white border-teal-800"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            Poly-Canopies
          </Link>
          <Link
            href="/farms?tier=FARMGATE_PROCESSING_SILO"
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium ${
              tierFilter === "FARMGATE_PROCESSING_SILO"
                ? "bg-amber-800 text-white border-amber-800"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            Silos &amp; Processing
          </Link>
        </div>
      </div>

      {/* Farms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {farms.map((farm) => {
          const activeCycle = farm.cropCycles[0];
          const sensor = farm.sensorDevices[0];
          const latestReading = sensor?.readings[0];

          return (
            <Card key={farm.id} hoverEffect className="flex flex-col justify-between">
              <CardHeader className="bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {farm.farmCode}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      {farm.farmerProfile.district} Dist.
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-base">{farm.name}</CardTitle>
                </div>
                <StatusBadge status={farm.tier} />
              </CardHeader>

              <CardContent className="space-y-4 pt-4 text-xs">
                {/* Farmer Info */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F9F6] border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#1B532D] text-white flex items-center justify-center font-bold text-xs">
                      {farm.farmerProfile.user.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-bold text-[#0F1D2F]">{farm.farmerProfile.user.name}</p>
                      <p className="text-[11px] text-slate-500">{farm.farmerProfile.village}, {farm.farmerProfile.mandal}</p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500 font-medium">0.25 Ac</span>
                </div>

                {/* Active Crop */}
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px] tracking-wider mb-1">
                    Current Crop Cycle
                  </span>
                  {activeCycle ? (
                    <div className="flex items-center justify-between p-2 bg-emerald-50/40 rounded border border-emerald-100">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-900">
                        <Sprout className="w-4 h-4 text-emerald-600" />
                        <span>{activeCycle.cropCatalogue.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200">
                        Stage: {activeCycle.stage}
                      </span>
                    </div>
                  ) : (
                    <p className="text-slate-400 italic">No cycle currently active</p>
                  )}
                </div>

                {/* Live Sensor Capsule */}
                {sensor && (
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between text-[11px] mb-1.5">
                      <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        {sensor.deviceCode}
                      </span>
                      <StatusBadge status={sensor.status} />
                    </div>

                    {latestReading && (
                      <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-white p-1.5 rounded border border-slate-100">
                        <div>
                          <span className="text-slate-400 block">Moisture</span>
                          <span className="font-bold text-slate-800">{latestReading.soilMoisturePercent?.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">EC (mS)</span>
                          <span className="font-bold text-slate-800">{latestReading.ecMilliSiemens?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Temp</span>
                          <span className="font-bold text-slate-800">{latestReading.ambientTemperatureC?.toFixed(1)}°C</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Link */}
                <div className="pt-2">
                  <Link
                    href={`/farms/${farm.id}`}
                    className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-[#1B532D] hover:text-white text-xs font-semibold text-slate-800 border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Inspect Unit Specifications</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
