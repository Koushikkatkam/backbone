import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ShieldAlert } from "lucide-react";

export default async function AuditTrailPage() {
  const auditLogs = await prisma.auditLog.findMany({
    include: { user: true },
    orderBy: { timestamp: "desc" },
    take: 50,
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Cryptographic Audit Log &amp; Governance
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Immutable tracking of state transitions, inventory holds, and instant payout disbursements.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-700" />
            <span>System Event History</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-4 py-3">Action Type</th>
                  <th className="px-4 py-3">Target Entity</th>
                  <th className="px-4 py-3">Initiated By</th>
                  <th className="px-4 py-3">State Transition &amp; Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8E0]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors font-mono">
                    <td className="px-5 py-3.5 text-slate-500 text-[11px]">
                      {log.timestamp.toISOString().slice(0, 19).replace("T", " ")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-slate-800">
                      {log.entityType} ({log.entityId.slice(0, 12)}...)
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 font-sans">
                      {log.user ? `${log.user.name} (${log.user.role})` : "System Engine"}
                    </td>
                    <td className="px-4 py-3.5 font-sans text-slate-600 max-w-xs truncate">
                      {log.reason || "Automatic workflow step recorded"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
