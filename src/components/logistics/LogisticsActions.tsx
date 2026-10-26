"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, CheckCircle2, ShieldCheck, AlertCircle, Loader2, X, Thermometer } from "lucide-react";

interface LogisticsActionsProps {
  shipment: {
    id: string;
    shipmentCode: string;
    status: string;
    orderNumber: string;
    orderedKg: number;
    destination: string;
    temperatureLogC: number | null;
  };
}

export function LogisticsActions({ shipment }: LogisticsActionsProps) {
  const router = useRouter();

  // Dispatch Modal State
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [cargoTemp, setCargoTemp] = useState<number>(shipment.temperatureLogC ?? 4.2);
  const [trackingNotes, setTrackingNotes] = useState("Departed hub. Reefer compressor verified active.");
  const [dispatchLoading, setDispatchLoading] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Delivery QC Modal State
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [inspectedBy, setInspectedBy] = useState("K. Ramesh (QC Lead Inspector)");
  const [verifiedGrade, setVerifiedGrade] = useState<"GRADE_A" | "GRADE_B" | "GRADE_C">("GRADE_A");
  const [sampledKg, setSampledKg] = useState<number>(Math.max(5, Math.round(shipment.orderedKg * 0.1)));
  const [acceptedKg, setAcceptedKg] = useState<number>(shipment.orderedKg);
  const [rejectedKg, setRejectedKg] = useState<number>(0);
  const [freshnessScore, setFreshnessScore] = useState<number>(9.5);
  const [rejectionReason, setRejectionReason] = useState("");
  const [deliveryLoading, setDeliveryLoading] = useState(false);
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const [deliverySuccess, setDeliverySuccess] = useState<string | null>(null);

  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchLoading(true);
    setDispatchError(null);

    try {
      const res = await fetch(`/api/v1/logistics/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DISPATCH",
          temperatureLogC: Number(cargoTemp),
          trackingNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to dispatch shipment");
      }

      setIsDispatchOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setDispatchError(err instanceof Error ? err.message : "Dispatch failed");
    } finally {
      setDispatchLoading(false);
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeliveryLoading(true);
    setDeliveryError(null);
    setDeliverySuccess(null);

    try {
      const res = await fetch(`/api/v1/logistics/${shipment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "DELIVER_AND_ACCEPT",
          inspectedBy,
          sampledQuantityKg: Number(sampledKg),
          totalDeliveredQuantityKg: Number(acceptedKg + rejectedKg),
          acceptedQuantityKg: Number(acceptedKg),
          rejectedQuantityKg: Number(rejectedKg),
          verifiedGrade,
          freshnessScore: Number(freshnessScore),
          rejectionReason: rejectedKg > 0 ? rejectionReason || "Grade variance" : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Delivery acceptance failed");
      }

      setDeliverySuccess("Delivery verified and QC accepted! Farmer payable and buyer invoice created.");
      setTimeout(() => {
        setIsDeliveryOpen(false);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setDeliveryError(err instanceof Error ? err.message : "Delivery handover failed");
    } finally {
      setDeliveryLoading(false);
    }
  };

  if (shipment.status === "DELIVERED") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Delivered &amp; QC Verified</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      {shipment.status === "SCHEDULED" && (
        <button
          onClick={() => setIsDispatchOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <Truck className="w-3.5 h-3.5" />
          <span>Dispatch Vehicle</span>
        </button>
      )}

      {shipment.status === "IN_TRANSIT" && (
        <button
          onClick={() => setIsDeliveryOpen(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Confirm Delivery &amp; QC</span>
        </button>
      )}

      {/* Dispatch Modal */}
      {isDispatchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Logistics Departure Checklist</h3>
                <p className="text-[11px] text-slate-300">
                  Verifies cold-chain departure for Shipment {shipment.shipmentCode}.
                </p>
              </div>
              <button
                onClick={() => setIsDispatchOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="p-6 space-y-4 text-xs">
              {dispatchError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{dispatchError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-sky-600" />
                  <span>Cargo Chamber Temperature (°C)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cargoTemp}
                  onChange={(e) => setCargoTemp(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] font-mono font-bold outline-none"
                  required
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Target standard: 3.5°C to 5.0°C</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Departure &amp; Route Tracking Notes
                </label>
                <textarea
                  rows={2}
                  value={trackingNotes}
                  onChange={(e) => setTrackingNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDispatchOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={dispatchLoading}
                  className="px-4 py-2 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {dispatchLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Dispatch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delivery and QC Modal */}
      {isDeliveryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Quality Handover Gate
                </span>
                <h3 className="font-bold text-sm tracking-tight text-white mt-0.5">
                  Confirm Delivery &bull; {shipment.shipmentCode}
                </h3>
              </div>
              <button
                onClick={() => setIsDeliveryOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeliverySubmit} className="p-6 space-y-4 text-xs">
              {deliveryError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{deliveryError}</span>
                </div>
              )}

              {deliverySuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{deliverySuccess}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Inspector Name</label>
                  <input
                    type="text"
                    value={inspectedBy}
                    onChange={(e) => setInspectedBy(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Verified QC Grade</label>
                  <select
                    value={verifiedGrade}
                    onChange={(e) => setVerifiedGrade(e.target.value as "GRADE_A" | "GRADE_B" | "GRADE_C")}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                  >
                    <option value="GRADE_A">Grade A (Premium)</option>
                    <option value="GRADE_B">Grade B (Standard)</option>
                    <option value="GRADE_C">Grade C (Processing)</option>
                  </select>
                </div>
              </div>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sampled (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={sampledKg}
                    onChange={(e) => setSampledKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Accepted (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={acceptedKg}
                    onChange={(e) => setAcceptedKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-emerald-900 font-bold outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Rejected (kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={rejectedKg}
                    onChange={(e) => setRejectedKg(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-rose-900 font-bold outline-none"
                  />
                </div>
              </div>

              {/* Freshness Score */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Freshness Score (1 - 10)</label>
                  <span className="font-bold text-emerald-800">{freshnessScore} / 10</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="10"
                  step="0.1"
                  value={freshnessScore}
                  onChange={(e) => setFreshnessScore(parseFloat(e.target.value))}
                  className="w-full accent-[#1B532D]"
                />
              </div>

              {rejectedKg > 0 && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Rejection / Defect Reason
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Minor wilting on outer leaves"
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                  />
                </div>
              )}

              {/* Automatic financial consequence note */}
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>Automated 24h Payout Trigger</span>
                </p>
                <p className="text-[11px] text-emerald-800">
                  Accepting {acceptedKg} kg automatically schedules a guaranteed farmer payable and generates buyer invoice.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDeliveryOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deliveryLoading || acceptedKg <= 0}
                  className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {deliveryLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Sign &bull; Accept Handover</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
