"use client";

import React, { useState } from "react";
import { X, MapPin, Clock, Sparkles } from "lucide-react";
import { DEMO_TIMELINE_LABEL } from "@/lib/constants";

export function PrototypeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside
      aria-label="Pilot Prototype Notice"
      className="bg-[#0B192C] text-slate-200 border-b border-slate-700/80 px-4 py-2 text-xs flex flex-wrap items-center justify-between gap-3 shadow-inner"
    >
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 bg-emerald-950/70 border border-emerald-500/40 px-2 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          Prototype Mode
        </span>
        <span className="flex items-center gap-1 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <strong>Warangal & Mulugu Pilot (Telangana)</strong>
          <span className="text-slate-400 hidden sm:inline">— 10 Fictional 0.25-Acre Units</span>
        </span>
        <span className="text-slate-400 hidden md:inline">|</span>
        <span className="text-slate-300 flex items-center gap-1.5 hidden md:flex">
          <Clock className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-mono text-sky-200">{DEMO_TIMELINE_LABEL}</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-600/30 px-2 py-0.5 rounded hidden lg:inline">
          Notice: Goals (2.4x income, &lt;5% waste, 24h settlement) are model targets, not validated results.
        </span>
        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
