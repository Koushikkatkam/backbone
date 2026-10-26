"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, CheckCircle2, AlertCircle, Loader2, X, Zap, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

interface DisbursePayableButtonProps {
  payable: {
    id: string;
    payableCode: string;
    farmerName: string;
    upiId: string;
    netPayable: number;
    reason: string;
  };
}

export function DisbursePayableButton({ payable }: DisbursePayableButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settlementResult, setSettlementResult] = useState<{
    settlementCode: string;
    transactionReference: string;
    disbursedAmount: number;
    hoursToSettle: number;
  } | null>(null);

  const handleDisburse = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/finance/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payableId: payable.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Disbursal failed");
      }

      setSettlementResult(data.data.settlement);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Disbursal failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSettlementResult(null);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold shadow-xs transition-colors"
      >
        <Zap className="w-3.5 h-3.5 text-amber-300" />
        <span>Disburse 24h Payout</span>
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} maxWidth="max-w-md">
        <div className="text-xs">
          {/* Header */}
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Guaranteed 24-Hour Settlement SLA
                </span>
                <h3 className="font-bold text-sm tracking-tight text-white mt-0.5">
                  Instant Farmgate Payout Clearance
                </h3>
              </div>
              <button onClick={handleClose} className="text-slate-400 hover:text-white">
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

              {settlementResult ? (
                /* Settlement Receipt View */
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                    <p className="font-bold text-emerald-950 text-sm">Disbursal Successful!</p>
                    <p className="text-[11px] text-emerald-800">
                      Funds cleared through simulated NPCI Instant UPI gateway.
                    </p>
                  </div>

                  <div className="p-3.5 bg-[#F8F9F6] rounded-xl border border-[#E2E8E0] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Settlement ID:</span>
                      <span className="font-mono font-bold text-emerald-900">
                        {settlementResult.settlementCode}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">UPI Ref:</span>
                      <span className="font-mono font-bold text-slate-800 truncate max-w-[200px]">
                        {settlementResult.transactionReference}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Amount Paid:</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        {formatINR(settlementResult.disbursedAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Clearance Speed:</span>
                      <span className="font-bold text-emerald-700">
                        {settlementResult.hoursToSettle} hrs (&lt; 24h SLA)
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Recipient:</span>
                      <span className="font-medium text-slate-800">{payable.farmerName} ({payable.upiId})</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Simulated SMS notification dispatched to farmer mobile device.</span>
                  </div>

                  <button
                    onClick={handleClose}
                    className="w-full py-2 rounded-lg bg-[#0F1D2F] hover:bg-[#182C44] text-white font-semibold shadow-xs"
                  >
                    Done &bull; Close Receipt
                  </button>
                </div>
              ) : (
                /* Confirmation Prompt View */
                <div className="space-y-4">
                  <div className="p-3.5 bg-[#F8F9F6] rounded-xl border border-[#E2E8E0] space-y-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Payable Code:</span>
                      <span className="font-mono font-bold text-slate-800">{payable.payableCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Farmer:</span>
                      <span className="font-bold text-[#0F1D2F]">{payable.farmerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Registered VPA:</span>
                      <span className="font-mono text-emerald-800 font-semibold">{payable.upiId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Net Payable Amount:</span>
                      <span className="font-bold text-emerald-800 text-sm">
                        {formatINR(payable.netPayable)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 text-slate-500 text-[11px]">
                      Reason: {payable.reason}
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Demo mode: Dispatches an authentic simulated payment reference without debiting real funds.
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2">
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
                      onClick={handleDisburse}
                      className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                    >
                      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>Authorize 24h Payout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
        </div>
      </Modal>
    </>
  );
}

export function FinanceExportButtons() {
  return (
    <div className="flex items-center gap-2">
      <a
        href="/api/v1/finance/export?type=payables"
        download="farmer-payables.csv"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        title="Download Farmer Payables CSV"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Payables CSV</span>
      </a>
      <a
        href="/api/v1/finance/export?type=settlements"
        download="settlements-ledger.csv"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
        title="Download Settlements Ledger CSV"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Settlements CSV</span>
      </a>
    </div>
  );
}
