import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { ResetButton } from "@/components/admin/ResetButton";
import { RefreshCw, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            System Settings &amp; Prototype Admin Controls
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global environment parameters, database synchronization, and demo reset routines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Reset Database Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Reset Prototype Demo Data</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            <p className="text-slate-600 leading-relaxed">
              Resets all tables and re-seeds the standard Telangana pilot dataset: 10 smallholder farmer units,
              3 infrastructure tiers, crop cycles, simulated sensor telemetry readings, and 24-hr payment settlements.
            </p>

            <ResetButton />
          </CardContent>
        </Card>

        {/* Database & Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slate-600" />
              <span>Environment &amp; Architecture Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Database Engine:</span>
              <span className="font-mono font-bold text-slate-800">SQLite (Local dev.db)</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Production Path:</span>
              <span className="text-slate-800 font-medium">PostgreSQL (Documented migration)</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Integration Mode:</span>
              <span className="font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                mock (Offline-deterministic)
              </span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">API Gateway Version:</span>
              <span className="font-mono text-slate-800">/api/v1 (REST / Mobile Reusable)</span>
            </div>
            <div className="flex justify-between pb-2 border-b border-slate-100">
              <span className="text-slate-500">Target Pilot Region:</span>
              <span className="text-slate-800 font-medium">Warangal &amp; Mulugu, Telangana</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
