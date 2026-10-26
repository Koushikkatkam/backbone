"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Wrench, Loader2, X, AlertCircle, ArrowUpRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface FarmActionsProps {
  farmId: string;
  farmName: string;
  activeCycle?: {
    id: string;
    stage: string;
    cropName: string;
  } | null;
}

export function FarmActions({ farmId, farmName, activeCycle }: FarmActionsProps) {
  const router = useRouter();

  // Maintenance Modal State
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [category, setCategory] = useState("Solar Panel Dusting & Inverter Check");
  const [description, setDescription] = useState("Scheduled preventive cleaning and cable tension check.");
  const [cost, setCost] = useState<number>(350);
  const [performedBy, setPerformedBy] = useState("Franchise Technical Field Team");
  const [maintLoading, setMaintLoading] = useState(false);
  const [maintError, setMaintError] = useState<string | null>(null);

  // Stage Update State
  const [isStageOpen, setIsStageOpen] = useState(false);
  const [newStage, setNewStage] = useState(activeCycle?.stage || "VEGETATIVE");
  const [stageLoading, setStageLoading] = useState(false);
  const [stageError, setStageError] = useState<string | null>(null);

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMaintLoading(true);
    setMaintError(null);

    try {
      const res = await fetch(`/api/v1/farms/${farmId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          cost: Number(cost),
          performedBy,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to log maintenance");
      }

      setIsMaintOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setMaintError(err instanceof Error ? err.message : "Maintenance logging failed");
    } finally {
      setMaintLoading(false);
    }
  };

  const handleStageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCycle) return;

    setStageLoading(true);
    setStageError(null);

    try {
      const res = await fetch("/api/v1/crops", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_STAGE",
          cropCycleId: activeCycle.id,
          stage: newStage,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update stage");
      }

      setIsStageOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setStageError(err instanceof Error ? err.message : "Stage transition failed");
    } finally {
      setStageLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {activeCycle && (
        <button
          onClick={() => setIsStageOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-[#1B532D] hover:text-white text-emerald-900 border border-emerald-300 text-xs font-semibold transition-colors"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>Advance Crop Stage ({activeCycle.stage})</span>
        </button>
      )}

      <button
        onClick={() => setIsMaintOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
      >
        <Wrench className="w-3.5 h-3.5 text-slate-500" />
        <span>Log Maintenance</span>
      </button>

      {/* Maintenance Modal */}
      <Modal isOpen={isMaintOpen} onClose={() => setIsMaintOpen(false)} maxWidth="max-w-md">
        <div className="text-xs">
          <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm">Log Unit Maintenance</h3>
              <p className="text-[11px] text-slate-300">
                Records servicing activity for {farmName}.
              </p>
            </div>
            <button onClick={() => setIsMaintOpen(false)} className="text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleMaintenanceSubmit} className="p-6 space-y-4">
            {maintError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{maintError}</span>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category / Task</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Technician / Performed By</label>
              <input
                type="text"
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cost (INR)</label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Description &amp; Checklist Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs"
                required
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsMaintOpen(false)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={maintLoading}
                className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {maintLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Record</span>
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Stage Modal */}
      {activeCycle && (
        <Modal isOpen={isStageOpen} onClose={() => setIsStageOpen(false)} maxWidth="max-w-md">
          <div className="text-xs">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Advance Growth Stage</h3>
                <p className="text-[11px] text-slate-300">
                  {activeCycle.cropName} &bull; Current: {activeCycle.stage}
                </p>
              </div>
              <button onClick={() => setIsStageOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStageSubmit} className="p-6 space-y-4">
              {stageError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{stageError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Growth Stage</label>
                <select
                  value={newStage}
                  onChange={(e) => setNewStage(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                >
                  <option value="NURSERY">NURSERY</option>
                  <option value="VEGETATIVE">VEGETATIVE</option>
                  <option value="FLOWERING_FRUITING">FLOWERING / FRUITING</option>
                  <option value="MATURE">MATURE</option>
                  <option value="HARVESTING">HARVESTING</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStageOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={stageLoading}
                  className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {stageLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Update Stage</span>
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}
    </div>
  );
}
