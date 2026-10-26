"use client";

import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import { QrCode, Download, Copy, Check, SlidersHorizontal, Loader2, X, AlertCircle } from "lucide-react";

interface LotProvenanceActionsProps {
  lotId: string;
  lotCode: string;
  currentGrade: string;
  currentStatus: string;
  availableKg: number;
}

export function LotProvenanceActions({
  lotId,
  lotCode,
  currentGrade,
  currentStatus,
  availableKg,
}: LotProvenanceActionsProps) {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Adjustment Modal State
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState(currentGrade);
  const [curationStatus, setCurationStatus] = useState(currentStatus);
  const [adjustmentKg, setAdjustmentKg] = useState<number>(0);
  const [reason, setReason] = useState("");

  const lotUrl = typeof window !== "undefined" ? `${window.location.origin}/harvests/${lotCode}` : `/harvests/${lotCode}`;

  useEffect(() => {
    QRCode.toDataURL(
      lotUrl,
      {
        width: 240,
        margin: 2,
        color: {
          dark: "#0F1D2F",
          light: "#FFFFFF",
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [lotUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(lotUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `QR_${lotCode}.png`;
    a.click();
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setError("Please provide a documented reason of at least 5 characters.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/harvests/${lotId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          curationStatus,
          quantityAdjustmentKg: Number(adjustmentKg),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to adjust lot");
      }

      setIsAdjustOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* QR Code Presentation Box */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col items-center text-center">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          <QrCode className="w-4 h-4 text-emerald-700" />
          <span>Lot Provenance QR Code</span>
        </div>

        {qrDataUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={qrDataUrl}
            alt={`QR Code for Lot ${lotCode}`}
            className="w-36 h-36 rounded-lg border border-slate-200 p-1 bg-white shadow-xs"
          />
        ) : (
          <div className="w-36 h-36 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
            Generating QR...
          </div>
        )}

        <span className="font-mono text-[11px] font-bold text-emerald-900 mt-2 block">
          {lotCode}
        </span>
        <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
          {lotUrl}
        </span>

        <div className="flex items-center gap-2 mt-3 w-full">
          <button
            onClick={handleCopy}
            className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
            <span>{copied ? "Copied!" : "Copy URL"}</span>
          </button>
          <button
            onClick={handleDownload}
            className="py-1.5 px-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-[11px] font-semibold text-slate-700 flex items-center justify-center gap-1 transition-colors"
            title="Download QR Image"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Save</span>
          </button>
        </div>
      </div>

      {/* Adjust Lot Button */}
      <button
        onClick={() => setIsAdjustOpen(true)}
        className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-1.5 transition-colors shadow-xs"
      >
        <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
        <span>Adjust Grade / Stock Audit</span>
      </button>

      {/* Adjustment Modal */}
      {isAdjustOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm tracking-tight">Manual Lot Adjustment</h3>
                <p className="text-[11px] text-slate-300">
                  Updates grade or inventory with mandatory reason and cryptographic audit trail.
                </p>
              </div>
              <button
                onClick={() => setIsAdjustOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Lot Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                  >
                    <option value="GRADE_A">Grade A (Premium)</option>
                    <option value="GRADE_B">Grade B (Standard)</option>
                    <option value="GRADE_C">Grade C (Processing)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Curation Status</label>
                  <select
                    value={curationStatus}
                    onChange={(e) => setCurationStatus(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
                  >
                    <option value="AVAILABLE">Available</option>
                    <option value="PACKAGED">Packaged</option>
                    <option value="DISPATCH_READY">Dispatch Ready</option>
                    <option value="QUARANTINE">Quarantine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Quantity Delta (kg) &bull; Current Available: {availableKg} kg
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={adjustmentKg}
                  onChange={(e) => setAdjustmentKg(parseFloat(e.target.value) || 0)}
                  placeholder="0 (Positive to add, negative to deduct)"
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Resulting balance: {Math.max(0, availableKg + adjustmentKg)} kg
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Documented Reason &bull; Mandatory Audit Requirement
                </label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Moisture evaporation correction during cold storage holding."
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
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
                  <span>Save Adjustment</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
