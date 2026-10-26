"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { HandCoins, Loader2, X, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface CommitBuybackModalProps {
  offer: {
    id: string;
    offerCode: string;
    title: string;
    cropName: string;
    guaranteedPricePerKg: number;
    bonusGradeAPerKg: number;
    maxQuantityKg: number;
    remainingCapacityKg: number;
  };
}

export function CommitBuybackModal({ offer }: CommitBuybackModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [committedKg, setCommittedKg] = useState<number>(Math.min(100, offer.remainingCapacityKg));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (committedKg <= 0) {
      setError("Committed quantity must be greater than zero.");
      return;
    }

    if (committedKg > offer.remainingCapacityKg) {
      setError(`Requested commitment exceeds offer remaining capacity (${offer.remainingCapacityKg} kg).`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/buyback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buybackOfferId: offer.id,
          committedQuantityKg: Number(committedKg),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to commit buyback off-take");
      }

      setSuccess(`Committed ${committedKg} kg to offer ${offer.offerCode}!`);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Commitment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold shadow-xs transition-colors"
      >
        <HandCoins className="w-3.5 h-3.5 text-emerald-300" />
        <span>Sign Off-Take Agreement</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Guaranteed Procurement Floor
                </span>
                <h3 className="font-bold text-sm tracking-tight text-white mt-0.5">
                  Sign Off-Take Agreement &bull; {offer.cropName}
                </h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
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

              <div className="p-3 bg-[#F8F9F6] rounded-xl border border-[#E2E8E0] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Offer Code:</span>
                  <span className="font-mono font-bold text-slate-800">{offer.offerCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Guaranteed Floor Price:</span>
                  <span className="font-bold text-emerald-800">{formatINR(offer.guaranteedPricePerKg)} / kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Grade-A Quality Bonus:</span>
                  <span className="font-bold text-amber-700">+{formatINR(offer.bonusGradeAPerKg)} / kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Remaining Offer Cap:</span>
                  <span className="font-bold text-[#0F1D2F]">{offer.remainingCapacityKg} kg</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">
                    Committed Off-Take Quantity (kg)
                  </label>
                  <span className="text-slate-400 text-[11px]">Max: {offer.remainingCapacityKg} kg</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={offer.remainingCapacityKg}
                  step="1"
                  value={committedKg}
                  onChange={(e) => setCommittedKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] font-bold text-sm outline-none focus:ring-2 focus:ring-[#1B532D]/30"
                  required
                />
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Agreement legally commits procurement at minimum floor price with guaranteed 24h bank payout.
                </span>
              </div>

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
                  disabled={loading || committedKg <= 0 || committedKg > offer.remainingCapacityKg}
                  className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign Agreement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

interface MatchDemandButtonProps {
  responseId: string;
  farmerName: string;
  committedKg: number;
}

export function MatchDemandButton({ responseId, farmerName, committedKg }: MatchDemandButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchedOrder, setMatchedOrder] = useState<string | null>(null);

  const handleMatch = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/buyback/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          buybackResponseId: responseId,
          matchedQuantityKg: committedKg,
          deliveryAddress: "ITC Agri-Business Division, Hyderabad Cold Storage Hub",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Matching failed");
      }

      setMatchedOrder(data.result.matchedOrder.orderNumber);
      setTimeout(() => {
        setIsOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Matching failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-semibold transition-colors"
      >
        <span>Match to Buyer</span>
        <ArrowRight className="w-3 h-3 text-amber-700" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Match Committed Buyback Demand</h3>
                <p className="text-[11px] text-slate-300">
                  Atomically transfers committed produce to an active enterprise buyer order.
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {matchedOrder ? (
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                  <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                  <p className="font-bold text-emerald-950 text-sm">Matched Successfully!</p>
                  <p className="text-[11px] text-emerald-800">
                    B2B Order {matchedOrder} created and linked to this buyback commitment.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-[#F8F9F6] rounded-xl border border-[#E2E8E0] space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Farmer:</span>
                      <span className="font-bold text-[#0F1D2F]">{farmerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Committed Produce:</span>
                      <span className="font-bold text-emerald-800">{committedKg} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target Buyer:</span>
                      <span className="font-medium text-slate-800">ITC Agri-Business Division</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Double-counting prevention: This produce cannot be assigned twice.</span>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={handleMatch}
                      className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Execute Atomic Demand Match</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
