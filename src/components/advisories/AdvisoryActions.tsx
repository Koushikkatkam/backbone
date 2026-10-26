"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, Loader2, X, AlertCircle, ShieldCheck } from "lucide-react";

interface CropCycleOption {
  id: string;
  cycleCode: string;
  cropName: string;
  farmName: string;
  farmerName: string;
  stage: string;
}

interface GenerateAdvisoryModalProps {
  cropCycles: CropCycleOption[];
}

export function GenerateAdvisoryModal({ cropCycles }: GenerateAdvisoryModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedCycleId, setSelectedCycleId] = useState(cropCycles[0]?.id || "");
  const [category, setCategory] = useState("NUTRIENT_MANAGEMENT");
  const [severity, setSeverity] = useState("MEDIUM");
  const [customContent, setCustomContent] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/v1/advisories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cropCycleId: selectedCycleId,
          category,
          severity,
          customContent: customContent.trim() ? customContent.trim() : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to generate advisory");
      }

      setSuccess(`Advisory ${data.advisory.advisoryCode} dispatched to farmer.`);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(null);
        router.refresh();
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Generation failed");
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
        <Sparkles className="w-4 h-4 text-emerald-300" />
        <span>Generate AI Advisory</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-xs">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  Precision Agronomy Generator
                </span>
                <h3 className="font-bold text-sm tracking-tight text-white mt-0.5">
                  Issue Simulated AI Agronomy Advisory
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

              <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0" />
                <span>
                  Deterministic simulation: Generates tailored guidance based on current crop stage and telemetry.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Crop Cycle</label>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                  required
                >
                  {cropCycles.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.cropName} &mdash; {c.farmName} ({c.farmerName}) &bull; Stage: {c.stage}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                  >
                    <option value="NUTRIENT_MANAGEMENT">Nutrient Management</option>
                    <option value="PEST_DISEASE_ALERT">Pest &amp; Disease Alert</option>
                    <option value="IRRIGATION_TUNING">Irrigation Tuning</option>
                    <option value="HARVEST_TIMING">Harvest Timing</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Severity Level</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                  >
                    <option value="LOW">Low (Informational)</option>
                    <option value="MEDIUM">Medium (Recommended)</option>
                    <option value="HIGH">High (Action Required)</option>
                    <option value="CRITICAL">Critical (Immediate Flush)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Custom Agronomist Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  value={customContent}
                  onChange={(e) => setCustomContent(e.target.value)}
                  placeholder="Leave empty to use automated AI recipe based on crop stage & telemetry."
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs"
                />
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
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Dispatch Advisory</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

interface AcknowledgeAdvisoryButtonProps {
  advisoryId: string;
  isActioned: boolean;
}

export function AcknowledgeAdvisoryButton({ advisoryId, isActioned }: AcknowledgeAdvisoryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleAcknowledge = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/advisories/${advisoryId}`, {
        method: "PATCH",
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isActioned) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        <span>Actioned &bull; Protocol Met</span>
      </span>
    );
  }

  return (
    <button
      onClick={handleAcknowledge}
      disabled={loading}
      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#1B532D] hover:text-white text-emerald-900 border border-emerald-300 text-xs font-semibold transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
      <span>Acknowledge / Mark Completed</span>
    </button>
  );
}
