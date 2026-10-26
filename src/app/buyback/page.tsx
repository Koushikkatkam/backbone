/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR } from "@/lib/utils";
import { CommitBuybackModal, MatchDemandButton } from "@/components/buyback/BuybackActions";

export default async function BuybackPage() {
  let offers: any[] = [];
  try {
    offers = await prisma.buybackOffer.findMany({
      include: {
        cropCatalogue: true,
        responses: {
          include: {
            farmerProfile: {
              include: { user: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn("Database unavailable in BuybackPage, using fallback offers:", err);
  }

  if (offers.length === 0) {
    const { FALLBACK_BUYBACK_OFFERS, FALLBACK_CROP_CATALOGUES } = await import("@/server/fallbackData");
    offers = FALLBACK_BUYBACK_OFFERS.map((o) => ({
      ...o,
      cropCatalogue: FALLBACK_CROP_CATALOGUES.find((c) => c.id === o.cropCatalogueId) || FALLBACK_CROP_CATALOGUES[0],
      responses: [],
    }));
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Direct Farmer Buyback Agreements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configurable procurement offers, minimum price guarantees, and farmer off-take contracts.
          </p>
        </div>
      </div>

      {/* Active Buyback Offers */}
      <div className="space-y-6 mb-8">
        {offers.map((offer: any) => {
          const totalCommitted = (offer.responses || []).reduce((sum: number, r: any) => sum + r.committedQuantityKg, 0);
          const remainingCapacity = Math.max(0, offer.maxQuantityKg - totalCommitted);

          return (
            <Card key={offer.id} hoverEffect>
              <CardHeader className="bg-slate-50/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {offer.offerCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      Valid: {offer.validFrom.toISOString().slice(0, 10)} &rarr; {offer.validUntil.toISOString().slice(0, 10)}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-base text-[#0F1D2F]">{offer.title}</CardTitle>
                  <p className="text-xs text-emerald-800 font-medium mt-0.5">
                    Target Crop: {offer.cropCatalogue?.name}
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <StatusBadge status={offer.status} />
                  {offer.status === "ACTIVE" && remainingCapacity > 0 && (
                    <CommitBuybackModal
                      offer={{
                        id: offer.id,
                        offerCode: offer.offerCode,
                        title: offer.title,
                        cropName: offer.cropCatalogue?.name || "Target Crop",
                        guaranteedPricePerKg: offer.guaranteedPricePerKg,
                        bonusGradeAPerKg: offer.bonusGradeAPerKg,
                        maxQuantityKg: offer.maxQuantityKg,
                        remainingCapacityKg: remainingCapacity,
                      }}
                    />
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8F9F6] p-3.5 rounded-lg border border-[#E2E8E0] text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Guaranteed Floor</span>
                    <span className="text-base font-bold text-emerald-800">{formatINR(offer.guaranteedPricePerKg)} / kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Grade-A Quality Bonus</span>
                    <span className="text-base font-bold text-amber-800">+{formatINR(offer.bonusGradeAPerKg)} / kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Off-Take / Cap</span>
                    <span className="text-base font-bold text-[#0F1D2F]">{offer.maxQuantityKg.toLocaleString()} kg</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Remaining Capacity</span>
                    <span className="text-base font-bold text-emerald-800">{remainingCapacity.toLocaleString()} kg</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Contractual Terms</span>
                  <p className="text-slate-700 bg-white p-3 rounded-lg border border-slate-200 leading-relaxed">
                    {offer.terms}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                    Signed Farmer Off-Take Commitments ({offer.responses.length})
                  </span>
                  {offer.responses.length === 0 ? (
                    <p className="text-slate-400 italic">No farmer commitments signed yet for this offer.</p>
                  ) : (
                    <div className="space-y-2">
                      {(offer.responses || []).map((r: any) => (
                        <div
                          key={r.id}
                          className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-[#0F1D2F]">{r.farmerProfile.user.name}</span>
                            <span className="text-slate-500 text-[11px] ml-2">
                              ({r.farmerProfile.village}, {r.farmerProfile.district})
                            </span>
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              Signed: {r.signedDate.toISOString().slice(0, 10)}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-emerald-900">{r.committedQuantityKg} kg committed</span>
                            <StatusBadge status={r.status} />
                            {r.status === "ACCEPTED" && (
                              <MatchDemandButton
                                responseId={r.id}
                                farmerName={r.farmerProfile.user.name}
                                committedKg={r.committedQuantityKg}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}
