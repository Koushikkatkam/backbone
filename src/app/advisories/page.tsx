/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { User, CheckCircle2 } from "lucide-react";
import { GenerateAdvisoryModal, AcknowledgeAdvisoryButton } from "@/components/advisories/AdvisoryActions";

export default async function AdvisoriesPage() {
  let advisories: any[] = [];
  let activeCycles: any[] = [];

  try {
    const results = await Promise.all([
      prisma.agronomyAdvisory.findMany({
        include: {
          cropCycle: {
            include: {
              cropCatalogue: true,
              farmUnit: {
                include: { farmerProfile: { include: { user: true } } },
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
    advisories = results[0];
    activeCycles = results[1];
  } catch (err) {
    console.warn("Database unavailable in AdvisoriesPage, using fallback cycles:", err);
  }

  if (activeCycles.length === 0) {
    const { FALLBACK_CROP_CYCLES } = await import("@/server/fallbackData");
    activeCycles = FALLBACK_CROP_CYCLES;
  }

  const cycleOptions = activeCycles.map((c) => ({
    id: c.id,
    cycleCode: c.cycleCode,
    cropName: c.cropCatalogue.name,
    farmName: c.farmUnit.name,
    farmerName: c.farmUnit.farmerProfile.user.name,
    stage: c.stage,
  }));

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Agronomy Advisories &amp; Precision Guidance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Telemetry-driven bio-fertigation recipes, pest mitigation protocols, and pre-harvest timing.
          </p>
        </div>

        <GenerateAdvisoryModal cropCycles={cycleOptions} />
      </div>

      <div className="space-y-6">
        {advisories.map((adv) => {
          let parsedActions: string[] = [];
          try {
            parsedActions = JSON.parse(adv.recommendedActions);
            if (!Array.isArray(parsedActions)) {
              parsedActions = [adv.recommendedActions];
            }
          } catch {
            parsedActions = [adv.recommendedActions];
          }

          return (
            <Card key={adv.id} hoverEffect>
              <CardHeader className="bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {adv.advisoryCode}
                    </span>
                    <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                      {adv.source}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Category: {adv.category.replace(/_/g, " ")}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-base text-[#0F1D2F]">{adv.title}</CardTitle>
                  <p className="text-xs text-emerald-800 font-medium mt-0.5">
                    Target: {adv.cropCycle.cropCatalogue.name} at {adv.cropCycle.farmUnit.name} ({adv.cropCycle.farmUnit.farmerProfile.user.name})
                  </p>
                </div>
                <StatusBadge status={adv.severity} />
              </CardHeader>

              <CardContent className="space-y-4 pt-4 text-xs">
                <p className="text-slate-700 leading-relaxed text-xs bg-[#F8F9F6] p-3.5 rounded-lg border border-slate-100">
                  {adv.content}
                </p>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5 tracking-wider">
                    Recommended Action Steps
                  </span>
                  <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100 text-slate-800 space-y-1.5">
                    {parsedActions.map((action, i) => (
                      <p key={i} className="font-medium text-emerald-950 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{action}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-medium text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Issued by: {adv.issuedBy}
                  </span>

                  <AcknowledgeAdvisoryButton advisoryId={adv.id} isActioned={adv.isActioned} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
