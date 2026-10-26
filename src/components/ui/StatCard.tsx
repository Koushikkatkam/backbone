import React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  trendText?: string;
  trendDirection?: "up" | "down" | "neutral";
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  isSimulated?: boolean;
  className?: string;
}

export function StatCard({
  title,
  value,
  subValue,
  trendText,
  trendDirection = "neutral",
  icon: Icon,
  iconBgColor = "bg-emerald-50",
  iconColor = "text-[#1B532D]",
  isSimulated = true,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-[#E2E8E0] p-5 shadow-sm relative overflow-hidden transition-all hover:border-emerald-300",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#0F1D2F] tracking-tight">{value}</span>
            {subValue && <span className="text-xs text-slate-500 font-medium">{subValue}</span>}
          </div>
        </div>
        <div className={cn("p-2.5 rounded-lg border border-slate-100", iconBgColor)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs border-t border-slate-100 pt-3">
        {trendText ? (
          <span
            className={cn(
              "font-medium flex items-center gap-1",
              trendDirection === "up" && "text-emerald-700",
              trendDirection === "down" && "text-rose-600",
              trendDirection === "neutral" && "text-slate-600"
            )}
          >
            {trendText}
          </span>
        ) : (
          <span className="text-slate-400">Target Benchmark</span>
        )}

        {isSimulated && (
          <span className="font-mono text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
            SIMULATED
          </span>
        )}
      </div>
    </div>
  );
}
