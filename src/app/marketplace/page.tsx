/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { QrCode } from "lucide-react";
import { PurchaseLotModal } from "@/components/marketplace/PurchaseLotModal";

export default async function MarketplacePage() {
  let availableLots: any[] = [];
  try {
    availableLots = await prisma.harvestLot.findMany({
      where: {
        availableQuantityKg: { gt: 0 },
      },
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
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn("Database unavailable in MarketplacePage, using fallback lots:", err);
  }

  if (availableLots.length === 0) {
    const { FALLBACK_HARVEST_LOTS } = await import("@/server/fallbackData");
    availableLots = FALLBACK_HARVEST_LOTS;
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            B2B Farmgate Produce Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified Grade-A and Grade-B lots sourced directly from smallholder hydroponic &amp; canopy units.
          </p>
        </div>
      </div>

      {availableLots.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-700">No produce currently available for procurement</p>
          <p className="text-xs text-slate-500 mt-1">
            Check active crop cycles or register a harvest to list new lots.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableLots.map((lot) => {
            const crop = lot.harvestRecord.cropCycle.cropCatalogue;
            const farm = lot.harvestRecord.farmUnit;

            return (
              <Card key={lot.id} hoverEffect className="flex flex-col justify-between">
                <CardHeader className="bg-slate-50/60">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {lot.lotCode}
                      </span>
                      <StatusBadge status={lot.grade} />
                    </div>
                    <CardTitle className="mt-2 text-base text-[#0F1D2F]">{crop.name}</CardTitle>
                    <p className="text-xs text-slate-500">{crop.variety}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4 text-xs">
                  <div className="p-3 bg-[#F8F9F6] rounded-lg border border-slate-100 space-y-1.5 text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Available Stock:</span>
                      <span className="font-bold text-[#0F1D2F]">{lot.availableQuantityKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Unit Price:</span>
                      <span className="font-bold text-emerald-800 text-sm">{formatINR(lot.unitPricePerKg)} / kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Origin Farm:</span>
                      <span className="font-medium text-slate-800">{farm.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-slate-800">{farm.farmerProfile.village}, {farm.farmerProfile.district}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <PurchaseLotModal
                      lot={{
                        id: lot.id,
                        lotCode: lot.lotCode,
                        grade: lot.grade,
                        availableQuantityKg: lot.availableQuantityKg,
                        unitPricePerKg: lot.unitPricePerKg,
                        cropName: crop.name,
                        farmName: farm.name,
                        location: farm.farmerProfile.district,
                      }}
                    />
                    <Link
                      href={`/harvests/${lot.lotCode}`}
                      className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors"
                      title="View Traceability"
                    >
                      <QrCode className="w-4 h-4 text-slate-600" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
