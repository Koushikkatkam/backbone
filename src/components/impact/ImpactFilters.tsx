"use client";

import React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Download } from "lucide-react";

interface ImpactFiltersProps {
  currentDistrict?: string;
  currentTier?: string;
  districts: string[];
  tiers: string[];
  metricsData: {
    postHarvestLossRate: string;
    forecastYieldKg: number;
    confirmedMarketableKg: number;
    buybackOfferedKg: number;
    buybackAcceptedKg: number;
    dispatchedKg: number;
    deliveredKg: number;
    settledWithin24hRate: string;
  };
}

export function ImpactFilters({
  currentDistrict,
  currentTier,
  districts,
  tiers,
  metricsData,
}: ImpactFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  };

  const handleExportCSV = () => {
    const header = "MetricName,Value,Unit,Definition,DataStatus\n";
    const rows = [
      `Post-Harvest Loss Rate,${metricsData.postHarvestLossRate},%,"(Gross harvest - Marketable harvest) / Gross harvest",RECORDED_FIELD_METRIC`,
      `Forecast Crop Yield,${metricsData.forecastYieldKg},kg,"Aggregated target yield across active crop cycles",RECORDED_FIELD_METRIC`,
      `Confirmed Marketable Stock,${metricsData.confirmedMarketableKg},kg,"Actual available harvest lots in cold storage",RECORDED_FIELD_METRIC`,
      `Guaranteed Buyback Offered,${metricsData.buybackOfferedKg},kg,"Total quantity cap across active buyback agreements",RECORDED_FIELD_METRIC`,
      `Guaranteed Buyback Accepted,${metricsData.buybackAcceptedKg},kg,"Total farmer commitments signed",RECORDED_FIELD_METRIC`,
      `Cold-Chain Dispatched,${metricsData.dispatchedKg},kg,"Produce in transit or delivered via reefer fleet",RECORDED_FIELD_METRIC`,
      `Verified Delivered & QC Accepted,${metricsData.deliveredKg},kg,"Produce accepted at destination by buyer QC",RECORDED_FIELD_METRIC`,
      `24-Hour Settlement SLA Compliance,${metricsData.settledWithin24hRate},%,"Settlement records cleared within 24 hours of delivery",RECORDED_FIELD_METRIC`,
    ];

    const csvContent = header + rows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `project_backbone_impact_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200 shadow-xs mb-8">
      <div className="flex items-center gap-3 flex-wrap text-xs">
        <div>
          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
            Cluster District
          </label>
          <select
            value={currentDistrict || ""}
            onChange={(e) => handleFilterChange("district", e.target.value)}
            className="p-1.5 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
          >
            <option value="">All Clusters (Warangal &amp; Mulugu)</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-slate-400 block text-[10px] uppercase font-bold mb-1">
            Infrastructure Tier
          </label>
          <select
            value={currentTier || ""}
            onChange={(e) => handleFilterChange("tier", e.target.value)}
            className="p-1.5 border border-slate-200 rounded-lg text-[#0F1D2F] bg-white outline-none"
          >
            <option value="">All Tiers (A-Frames, Canopies, Silos)</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {(currentDistrict || currentTier) && (
          <button
            onClick={() => router.push(pathname)}
            className="mt-4 text-xs font-semibold text-emerald-800 hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      <button
        onClick={handleExportCSV}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors"
      >
        <Download className="w-3.5 h-3.5 text-slate-500" />
        <span>Export Impact Report (CSV)</span>
      </button>
    </div>
  );
}
