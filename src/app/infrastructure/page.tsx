/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { Cpu, Sun, Droplets, Wrench } from "lucide-react";
import Link from "next/link";

export default async function InfrastructurePage() {
  let installations: any[] = [];
  let maintenanceLogs: any[] = [];

  try {
    const results = await Promise.all([
      prisma.infrastructureInstallation.findMany({
        include: {
          farmUnit: {
            include: { farmerProfile: { include: { user: true } } },
          },
        },
        orderBy: { assetCode: "asc" },
      }),
      prisma.maintenanceLog.findMany({
        include: {
          farmUnit: {
            include: { farmerProfile: { include: { user: true } } },
          },
        },
        orderBy: { performedAt: "desc" },
      }),
    ]);
    installations = results[0];
    maintenanceLogs = results[1];
  } catch (err) {
    console.warn("Database unavailable in InfrastructurePage, using fallback assets:", err);
  }

  if (installations.length === 0) {
    installations = [
      {
        id: "inst-01",
        assetCode: "ASSET-A-FRAME-01",
        systemType: "Vertical A-Frame Hydroponics (1,200 Cups)",
        solarCapacityKw: 2.5,
        waterTankCapacityLiters: 5000,
        status: "OPERATIONAL",
        farmUnit: { name: "Mallesham Hydroponic Unit 1", farmCode: "FU-WGL-DHM-01" },
      },
      {
        id: "inst-02",
        assetCode: "ASSET-CANOPY-02",
        systemType: "Semi-Closed UV Poly-Canopy 200 Micron",
        solarCapacityKw: 3.0,
        waterTankCapacityLiters: 8000,
        status: "OPERATIONAL",
        farmUnit: { name: "Komuraiah Canopy Unit 2", farmCode: "FU-WGL-DHM-02" },
      },
    ];
  }

  const totalSolarKw = installations.reduce((acc, i) => acc + i.solarCapacityKw, 0);
  const totalWaterLiters = installations.reduce((acc, i) => acc + i.waterTankCapacityLiters, 0);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Infrastructure &amp; Capital Assets
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Vertical hydroponics, poly-canopies, solar fertigation pumps, and farmgate grain/spice silos.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Installed Solar Capacity"
          value={`${totalSolarKw} kW`}
          subValue="Off-Grid Distributed"
          trendText="100% solar uptime"
          trendDirection="up"
          icon={Sun}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
        />

        <StatCard
          title="Total Water Reserves"
          value={`${totalWaterLiters.toLocaleString()} L`}
          subValue="Closed-Loop Recirculation"
          trendText="90% conservation rate"
          trendDirection="up"
          icon={Droplets}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-700"
        />

        <StatCard
          title="Active Asset Nodes"
          value={installations.length}
          subValue="All 10 Plots Equipped"
          trendText="Zero critical breakdowns"
          trendDirection="up"
          icon={Cpu}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />
      </div>

      {/* Asset Registry Table */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Installed Asset Registry (10 Pilot Plots)</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Hardware specifications, solar pump rating, and inspection state
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Asset Code</th>
                    <th className="px-4 py-3">Farm &amp; Operator</th>
                    <th className="px-4 py-3">Infrastructure Tier</th>
                    <th className="px-4 py-3">Solar (kW)</th>
                    <th className="px-4 py-3">Reservoir (L)</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E0]">
                  {installations.map((inst) => (
                    <tr key={inst.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {inst.assetCode}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/farms/${inst.farmUnitId}`}
                          className="font-bold text-[#0F1D2F] hover:text-emerald-800"
                        >
                          {inst.farmUnit.name}
                        </Link>
                        <p className="text-[11px] text-slate-500">
                          {inst.farmUnit.farmerProfile.user.name} ({inst.farmUnit.farmerProfile.district})
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={inst.tier} />
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#0F1D2F]">
                        {inst.solarCapacityKw} kW
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#0F1D2F]">
                        {inst.waterTankCapacityLiters.toLocaleString()} L
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={inst.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Maintenance Logs */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Field Maintenance &amp; Servicing Log
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {maintenanceLogs.map((log) => (
            <div key={log.id} className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F1D2F] flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-slate-500" />
                  {log.category} &bull; {log.farmUnit.name}
                </span>
                <span className="font-mono text-slate-400 text-[11px]">{log.performedAt.toISOString().slice(0, 10)}</span>
              </div>
              <p className="text-slate-600">{log.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                <span>By: {log.performedBy}</span>
                <span className="font-bold text-slate-800">Cost: ₹{log.cost}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
