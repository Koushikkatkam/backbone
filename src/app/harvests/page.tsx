/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { ArrowRight, QrCode } from "lucide-react";
import { RegisterHarvestModal } from "@/components/harvests/RegisterHarvestModal";

export default async function HarvestsPage() {
  let lots: any[] = [];
  let activeCycles: any[] = [];

  try {
    const results = await Promise.all([
      prisma.harvestLot.findMany({
        include: {
          harvestRecord: {
            include: {
              farmUnit: {
                include: { farmerProfile: { include: { user: true } } },
              },
              cropCycle: {
                include: { cropCatalogue: true },
              },
            },
          },
          qualityInspections: true,
          orderLines: {
            include: {
              order: {
                include: { buyerProfile: true },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.cropCycle.findMany({
        where: { status: "ACTIVE" },
        include: {
          cropCatalogue: true,
          farmUnit: {
            include: { farmerProfile: { include: { user: true } } },
          },
        },
        orderBy: { plantedDate: "desc" },
      }),
    ]);
    lots = results[0];
    activeCycles = results[1];
  } catch (err) {
    console.warn("Database unavailable in HarvestsPage, using fallback lots:", err);
  }

  if (lots.length === 0) {
    const { FALLBACK_HARVEST_LOTS, FALLBACK_CROP_CYCLES } = await import("@/server/fallbackData");
    lots = FALLBACK_HARVEST_LOTS;
    activeCycles = FALLBACK_CROP_CYCLES;
  }

  const cycleOptions = activeCycles.map((c) => ({
    id: c.id,
    cycleCode: c.cycleCode,
    cropName: c.cropCatalogue.name,
    farmName: c.farmUnit.name,
    farmerName: c.farmUnit.farmerProfile.user.name,
    targetYieldKg: c.targetYieldKg,
    benchmarkPrice: c.cropCatalogue.benchmarkMarketPricePerKg,
  }));

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Harvest Records &amp; Traceable Lots
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Farmgate quality grading, barcode lot tracking, and end-to-end provenance verification.
          </p>
        </div>

        <RegisterHarvestModal cropCycles={cycleOptions} />
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Traceable Harvest Lots Registry</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Every lot is cryptographically linked to its origin farm, sensor logs, and settlement receipt
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Lot Code / QR</th>
                    <th className="px-4 py-3">Crop Variety</th>
                    <th className="px-4 py-3">Origin Farm &amp; Farmer</th>
                    <th className="px-4 py-3">Grade</th>
                    <th className="px-4 py-3">Available / Held</th>
                    <th className="px-4 py-3">Unit Price</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E0]">
                  {lots.map((lot) => (
                    <tr key={lot.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/harvests/${lot.lotCode}`}
                          className="font-mono font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{lot.lotCode}</span>
                        </Link>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {lot.storageFacility}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-[#0F1D2F]">
                          {lot.harvestRecord.cropCycle.cropCatalogue.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {lot.harvestRecord.cropCycle.cropCatalogue.variety}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-[#0F1D2F]">
                          {lot.harvestRecord.farmUnit.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {lot.harvestRecord.farmUnit.farmerProfile.user.name} ({lot.harvestRecord.farmUnit.farmerProfile.district})
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={lot.grade} />
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[#0F1D2F]">
                          {lot.availableQuantityKg} kg available
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {lot.reservedQuantityKg} kg committed
                        </p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-800">
                        {formatINR(lot.unitPricePerKg)} / kg
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          href={`/harvests/${lot.lotCode}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#1B532D] hover:text-white text-emerald-800 font-semibold text-xs border border-emerald-200 transition-colors"
                        >
                          <span>Trace Provenance</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
