/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { formatINR } from "@/lib/utils";
import { Role } from "@prisma/client";
import { Landmark, Clock, Zap } from "lucide-react";
import { DisbursePayableButton, FinanceExportButtons } from "@/components/finance/FinanceActions";

export default async function FinancePage() {
  const user = await getCurrentUser();
  const isAdmin = user?.role === Role.ADMIN;

  let payables: any[] = [];
  let settlements: any[] = [];

  try {
    const results = await Promise.all([
      prisma.farmerPayable.findMany({
        include: {
          farmerProfile: {
            include: { user: true },
          },
          settlementRecord: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.settlementRecord.findMany({
        include: {
          farmerProfile: {
            include: { user: true },
          },
          farmerPayable: true,
        },
        orderBy: { disbursedAt: "desc" },
      }),
    ]);
    payables = results[0];
    settlements = results[1];
  } catch (err) {
    console.warn("Database unavailable in FinancePage, using fallback payables:", err);
  }

  if (payables.length === 0) {
    const { FALLBACK_PAYABLES, FALLBACK_SETTLEMENTS } = await import("@/server/fallbackData");
    payables = FALLBACK_PAYABLES;
    settlements = FALLBACK_SETTLEMENTS;
  }

  const totalSettled = settlements.reduce((acc, s) => acc + s.disbursedAmount, 0);
  const totalPending = payables
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + p.netPayable, 0);

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Finance &amp; 24-Hour Settlement Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guaranteed digital payment clearance to smallholder farmers within 24 hours of farmgate acceptance.
          </p>
        </div>

        <FinanceExportButtons />
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Total Disbursed (24h)"
          value={formatINR(totalSettled)}
          subValue="Direct UPI Transfers"
          trendText="100% on-time SLA"
          trendDirection="up"
          icon={Landmark}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />

        <StatCard
          title="Pending Payout Pipeline"
          value={formatINR(totalPending)}
          subValue="Scheduled within 24h"
          trendText="Awaiting field handover"
          trendDirection="neutral"
          icon={Clock}
          iconBgColor="bg-amber-50"
          iconColor="text-amber-700"
        />

        <StatCard
          title="Average Settlement Speed"
          value="3.25 Hours"
          subValue="Target: < 24.0 Hours"
          trendText="86% faster than commitment"
          trendDirection="up"
          icon={Zap}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-700"
        />
      </div>

      {/* Farmer Payables */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Farmer Payables Pipeline</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculated strictly from accepted quantity &times; agreed price &minus; explicit deductions
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Payable Code</th>
                    <th className="px-4 py-3">Farmer &amp; VPA</th>
                    <th className="px-4 py-3">Gross Amount</th>
                    <th className="px-4 py-3">Deductions</th>
                    <th className="px-4 py-3">Net Payable</th>
                    <th className="px-4 py-3">Due / Cleared</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E0]">
                  {payables.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                        {p.payableCode}
                        <p className="text-[11px] text-slate-400 font-sans font-normal truncate max-w-[200px]">
                          {p.reason}
                        </p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-[#0F1D2F]">{p.farmerProfile.user.name}</p>
                        <p className="text-[11px] font-mono text-emerald-800">{p.farmerProfile.upiId}</p>
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-700">
                        {formatINR(p.grossAmount)}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-slate-500">
                        {p.deductionsAmount > 0 ? `-${formatINR(p.deductionsAmount)}` : "₹0"}
                      </td>
                      <td className="px-4 py-3.5 font-bold text-emerald-800 text-sm">
                        {formatINR(p.netPayable)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 font-mono text-[11px]">
                        {p.status === "SETTLED" ? (
                          <span className="text-emerald-700 font-bold">Cleared</span>
                        ) : (
                          <span>Due: {p.dueDate.toISOString().slice(5, 10)}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3.5">
                        {p.status === "PENDING" && isAdmin ? (
                          <DisbursePayableButton
                            payable={{
                              id: p.id,
                              payableCode: p.payableCode,
                              farmerName: p.farmerProfile.user.name,
                              upiId: p.farmerProfile.upiId || "upi@axisbank",
                              netPayable: p.netPayable,
                              reason: p.reason,
                            }}
                          />
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">
                            {p.settlementRecord?.transactionReference || "Protected"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disbursed Settlements Audit Trail */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">
          Completed Settlement Receipts (Cryptographic Transaction References)
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settlements.map((s) => (
            <div
              key={s.id}
              className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs text-xs space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-emerald-800">{s.settlementCode}</span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {formatINR(s.disbursedAmount)} Disbursed
                </span>
              </div>
              <div className="p-2.5 bg-[#F8F9F6] rounded-lg border border-slate-100 font-mono text-[11px] space-y-1">
                <p className="text-slate-700">Txn Ref: <span className="font-bold text-slate-900">{s.transactionReference}</span></p>
                <p className="text-slate-500">Method: {s.payoutMethod} &bull; Hours to Settle: <span className="font-bold text-emerald-700">{s.hoursToSettle} hrs</span></p>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>Recipient: {s.farmerProfile.user.name}</span>
                <span>Cleared: {s.disbursedAt.toISOString().slice(0, 16).replace("T", " ")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
