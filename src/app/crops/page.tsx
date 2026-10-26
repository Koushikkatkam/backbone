import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR } from "@/lib/utils";

export default async function CropsPage() {
  const [catalogues, cycles, observations] = await Promise.all([
    prisma.cropCatalogue.findMany({ orderBy: { name: "asc" } }),
    prisma.cropCycle.findMany({
      include: {
        cropCatalogue: true,
        farmUnit: {
          include: { farmerProfile: { include: { user: true } } },
        },
        growthObservations: {
          orderBy: { observedDate: "desc" },
          take: 1,
        },
      },
      orderBy: { plantedDate: "desc" },
    }),
    prisma.growthObservation.findMany({
      include: {
        cropCycle: {
          include: {
            cropCatalogue: true,
            farmUnit: true,
          },
        },
      },
      orderBy: { observedDate: "desc" },
      take: 6,
    }),
  ]);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Crop Operations &amp; Crop Catalogues
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configurable crop schedules, stage monitoring, and agronomy observations across the pilot farms.
          </p>
        </div>
      </div>

      {/* Configurable Crop Catalogues */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Configurable Crop Catalogue (Pilot Varieties)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {catalogues.map((crop) => (
            <Card key={crop.id} hoverEffect>
              <CardHeader className="bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {crop.cropCode}
                    </span>
                    {crop.teluguName && (
                      <span className="text-xs text-slate-500 font-semibold">{crop.teluguName}</span>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-base">{crop.name}</CardTitle>
                </div>
                <StatusBadge status={crop.preferredTier} />
              </CardHeader>

              <CardContent className="space-y-3 pt-4 text-xs">
                <p className="text-slate-600 leading-relaxed min-h-[36px]">{crop.description}</p>

                <div className="grid grid-cols-2 gap-2 bg-[#F8F9F6] p-3 rounded-lg border border-slate-100 text-slate-700">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Cycle Duration</span>
                    <span className="font-bold text-[#0F1D2F]">{crop.cycleDurationDays} Days</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Water / Day</span>
                    <span className="font-bold text-[#0F1D2F]">{crop.waterRequirementPerDayLiters} L</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Target Yield</span>
                    <span className="font-bold text-[#0F1D2F]">{crop.targetYieldKgPerAcre} kg / Ac</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase">Market Benchmark</span>
                    <span className="font-bold text-emerald-800">{formatINR(crop.benchmarkMarketPricePerKg)} / kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Active Crop Cycles Table */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Active Cultivation Cycles</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Stage progression, health indicators, and target yields
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Cycle Code</th>
                    <th className="px-4 py-3">Crop Variety</th>
                    <th className="px-4 py-3">Farm &amp; Operator</th>
                    <th className="px-4 py-3">Stage</th>
                    <th className="px-4 py-3">Planted &rarr; Harvest</th>
                    <th className="px-4 py-3">Target Yield</th>
                    <th className="px-4 py-3">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E0]">
                  {cycles.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-800">
                        {c.cycleCode}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#0F1D2F]">
                        {c.cropCatalogue.name}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#0F1D2F]">{c.farmUnit.name}</p>
                        <p className="text-[11px] text-slate-500">{c.farmUnit.farmerProfile.user.name}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2 py-0.5 rounded font-medium bg-slate-100 text-slate-800 border border-slate-200 text-[11px]">
                          {c.stage}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                        {c.plantedDate.toISOString().slice(5, 10)} &rarr; {c.expectedHarvestDate.toISOString().slice(5, 10)}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-[#0F1D2F]">
                        {c.targetYieldKg} kg
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={c.healthStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Growth Stage Observations */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Field Growth Observations (Agronomist Log)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {observations.map((obs) => (
            <div
              key={obs.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#0F1D2F]">
                  {obs.cropCycle.cropCatalogue.name} &bull; Stage: {obs.growthStage}
                </span>
                <span className="font-mono text-slate-400 text-[11px]">
                  {obs.observedDate.toISOString().slice(0, 10)}
                </span>
              </div>
              <p className="text-slate-600">{obs.notes}</p>
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
                <span>Height: {obs.plantHeightCm} cm &bull; Canopy: {obs.canopyCoveragePercent}%</span>
                <span>Observed by: {obs.observedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
