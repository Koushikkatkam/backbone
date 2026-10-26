"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, X, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface CropCycleOption {
  id: string;
  cycleCode: string;
  cropName: string;
  farmName: string;
  farmerName: string;
  targetYieldKg: number;
  benchmarkPrice: number;
}

interface RegisterHarvestModalProps {
  cropCycles: CropCycleOption[];
}

export function RegisterHarvestModal({ cropCycles }: RegisterHarvestModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedCycleId, setSelectedCycleId] = useState(cropCycles[0]?.id || "");
  const [grossQuantityKg, setGrossQuantityKg] = useState<number>(120);
  const [marketableQuantityKg, setMarketableQuantityKg] = useState<number>(115);
  const [grade, setGrade] = useState<"GRADE_A" | "GRADE_B" | "GRADE_C">("GRADE_A");
  const [farmgateNotes, setFarmgateNotes] = useState(
    "Peak morning harvest. Washed, trimmed and crated under protocol."
  );
  const [rejectionReason, setRejectionReason] = useState("");

  const selectedCycle = cropCycles.find((c) => c.id === selectedCycleId);
  const postHarvestLossKg = Math.max(0, grossQuantityKg - marketableQuantityKg);
  const lossPercentage =
    grossQuantityKg > 0 ? ((postHarvestLossKg / grossQuantityKg) * 100).toFixed(1) : "0.0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (marketableQuantityKg > grossQuantityKg) {
      setError("Marketable quantity cannot exceed gross harvested quantity.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/harvests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropCycleId: selectedCycleId,
          grossQuantityKg: Number(grossQuantityKg),
          marketableQuantityKg: Number(marketableQuantityKg),
          grade,
          rejectionReason: postHarvestLossKg > 0 ? rejectionReason || "Post-harvest trimming & outer leaf culling" : undefined,
          farmgateNotes,
          unitPricePerKg: selectedCycle?.benchmarkPrice,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to register harvest");
      }

      setSuccess(`Harvest successfully registered! Traceable Lot ${data.lot.lotCode} generated.`);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold shadow-xs transition-colors"
      >
        <PlusCircle className="w-4 h-4" />
        <span>Register Farmgate Harvest</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Farmgate Harvest &amp; Grading Logger</span>
                </h3>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Records field intake, grades lot, and creates traceable barcode lot with audit log.
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              {/* Crop Cycle Select */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Active Crop Cycle &bull; Cultivation Unit
                </label>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg bg-slate-50 text-[#0F1D2F] focus:bg-white focus:ring-2 focus:ring-[#1B532D]/30 outline-none"
                  required
                >
                  {cropCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cropName} &mdash; {c.farmName} ({c.farmerName}) &bull; {c.cycleCode}
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantities Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Gross Harvest (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={grossQuantityKg}
                    onChange={(e) => setGrossQuantityKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] focus:ring-2 focus:ring-[#1B532D]/30 outline-none font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Marketable Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.5"
                    value={marketableQuantityKg}
                    onChange={(e) => setMarketableQuantityKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] focus:ring-2 focus:ring-[#1B532D]/30 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              {/* Real-time Loss Indicator */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Calculated Post-Harvest Loss
                  </span>
                  <span className="font-bold text-[#0F1D2F]">{postHarvestLossKg.toFixed(1)} kg</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Loss Rate</span>
                  <span
                    className={`font-bold ${
                      parseFloat(lossPercentage) <= 5 ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {lossPercentage}% {parseFloat(lossPercentage) <= 5 ? "(Target <5% Met)" : ""}
                  </span>
                </div>
              </div>

              {/* Rejection / Loss Reason (when loss occurs) */}
              {postHarvestLossKg > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Culling / Loss Reason
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Field trimming, outer leaf culling, minor sun scald"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs focus:ring-2 focus:ring-[#1B532D]/30"
                  />
                </div>
              )}

              {/* Quality Grade */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Field Quality Grade
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["GRADE_A", "GRADE_B", "GRADE_C"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGrade(g)}
                      className={`py-2 px-3 rounded-lg border font-semibold transition-all text-center ${
                        grade === g
                          ? "bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/30"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {g.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Farmgate Quality Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Farmgate Observation Notes
                </label>
                <textarea
                  rows={2}
                  value={farmgateNotes}
                  onChange={(e) => setFarmgateNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] focus:ring-2 focus:ring-[#1B532D]/30 outline-none text-xs"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Harvest &amp; Generate Lot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
