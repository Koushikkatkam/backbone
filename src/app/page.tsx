import React from "react";
import Link from "next/link";
import { DEMO_USERS } from "@/lib/constants";
import { PrototypeBanner } from "@/components/ui/PrototypeBanner";
import {
  Sprout,
  Cpu,
  Layers,
  ArrowRight,
  Boxes,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9F6] text-[#0F1D2F] flex flex-col">
      <PrototypeBanner />

      {/* Top Navigation */}
      <header className="border-b border-[#E2E8E0] bg-white sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-[#1B532D] flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-[#0F1D2F]">PROJECT BACKBONE</span>
              <span className="block text-[10px] font-mono text-emerald-800 font-semibold tracking-wider">
                TELANGANA PILOT (WARANGAL &amp; MULUGU)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-slate-700 hover:text-[#1B532D] px-3 py-1.5"
            >
              Demo Roles
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              <span>Enter Application</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 lg:py-24 bg-gradient-to-b from-white to-[#F8F9F6] border-b border-[#E2E8E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Farm-to-Market Agricultural Technology Prototype</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0F1D2F] tracking-tight max-w-4xl mx-auto leading-tight">
            High-Yield Hydroponics &amp; Farmgate Market Coordination
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Connecting smallholder farmers in <strong>Warangal and Mulugu</strong> with vertical hydroponic A-frames,
            semi-closed poly-canopies, solar fertigation, and guaranteed <strong>24-hour instant buyback settlements</strong>.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-6 py-3.5 rounded-xl bg-[#1B532D] hover:bg-[#133E21] text-white text-sm font-bold shadow-md shadow-emerald-950/20 flex items-center gap-2 transition-all hover:scale-102"
            >
              <span>Explore Prototype Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-[#0F1D2F] border border-slate-300 text-sm font-bold shadow-xs transition-all"
            >
              Select Demo Persona (6 Roles)
            </Link>
          </div>

          {/* Quick Stats Grid */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Pilot Scale</span>
              <p className="text-xl font-bold text-[#0F1D2F] mt-1">10 Farmer Units</p>
              <span className="text-[11px] text-emerald-700 font-medium">0.25 Acres Each</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Cultivation Tiers</span>
              <p className="text-xl font-bold text-[#0F1D2F] mt-1">3 Infrastructures</p>
              <span className="text-[11px] text-emerald-700 font-medium">A-Frame, Canopy, Silo</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Settlement Target</span>
              <p className="text-xl font-bold text-[#0F1D2F] mt-1">&lt; 24 Hours</p>
              <span className="text-[11px] text-emerald-700 font-medium">Instant Digital Payout</span>
            </div>
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
              <span className="text-xs text-slate-500 font-medium">Integration Mode</span>
              <p className="text-xl font-bold text-[#0F1D2F] mt-1">Mock / Offline</p>
              <span className="text-[11px] text-purple-700 font-medium">Deterministic Telemetry</span>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Demo Personas Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1D2F] tracking-tight">
            Role-Based Demo Access
          </h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl mx-auto">
            Switch between all 6 fictional stakeholder identities to experience tailored views,
            privileges, and server-side authorization enforcement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_USERS.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-xl border border-[#E2E8E0] p-6 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-[#0F1D2F] text-emerald-400 flex items-center justify-center font-bold text-base shadow-inner">
                    {user.avatar}
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${user.badgeColor}`}>
                    {user.role}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#0F1D2F] mt-4">{user.name}</h3>
                <p className="text-xs text-emerald-800 font-medium">{user.roleTitle}</p>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">{user.bio}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/login?select=${user.id}`}
                  className="w-full text-center py-2 px-3 rounded-lg bg-slate-50 hover:bg-[#1B532D] hover:text-white text-xs font-semibold text-slate-800 border border-slate-200 transition-colors"
                >
                  Sign in as {user.role.toLowerCase().replace("_", " ")}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3 Cultivation Tiers Overview */}
      <section className="py-16 bg-white border-y border-[#E2E8E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1D2F] tracking-tight">
              Three Integrated Infrastructure Tiers
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl mx-auto">
              Engineered for climate resilience and maximum land efficiency in the semi-arid Telangana Deccan plateau.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-[#F8F9F6] border border-[#E2E8E0]">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-[#1B532D] flex items-center justify-center mb-4">
                <Boxes className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F1D2F]">Tier 1: Vertical Hydroponic A-Frames</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                High-density food-grade PVC channels with closed-loop solar nutrient fertigation. Specialized for quick-cycle
                culinary herbs: <strong>Gongura, Coriander, and Pudina</strong> (28-35 days).
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>90% water conservation vs flood irrigation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Zero soil contamination or chemical runoff</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F9F6] border border-[#E2E8E0]">
              <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F1D2F]">Tier 2: Semi-Closed Poly-Canopies</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                UV-stabilized 200-micron poly-canopies with 40-mesh anti-insect barriers and evaporative cooling foggers.
                Tailored for high-value <strong>Warangal Red Chilli and Vine Tomatoes</strong>.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Microclimate heat &amp; pest attenuation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Grade-A premium quality index &gt; 95%</span>
                </li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#F8F9F6] border border-[#E2E8E0]">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-[#0F1D2F]">Tier 3: Farmgate Processing &amp; Silos</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                Farmgate hermetic moisture-controlled storage silos (5-MT capacity) and solar convective dehydrators
                preventing distress sales for <strong>Onion, Pulses, and Cured Spices</strong>.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Post-harvest loss suppressed under 5%</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Farmgate grading &amp; immediate barcode tagging</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Target Notice & Architecture Statement */}
      <section className="py-12 bg-[#0F1D2F] text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/60 border border-amber-600/40 text-amber-300 text-xs font-semibold mb-4">
            Notice on Prototype Impact Targets
          </div>
          <p className="text-sm max-w-3xl mx-auto text-slate-300 leading-relaxed">
            Projected metrics (such as 2.4x income, &lt;5% spoilage, 90% water conservation, and sub-24h digital settlement)
            represent <strong>strategic pilot goals</strong> for the Warangal-Mulugu operational network, NOT validated retrospective results.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-white border-t border-[#E2E8E0] text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4">
          <p>Project Backbone — Full Stack Agricultural Technology Architecture (Shot 1 Foundation).</p>
          <div className="mt-2 flex justify-center gap-4 text-slate-600 font-medium">
            <Link href="/dashboard" className="hover:text-emerald-700">Dashboard</Link>
            <span>&bull;</span>
            <Link href="/farms" className="hover:text-emerald-700">Farm Units</Link>
            <span>&bull;</span>
            <Link href="/harvests" className="hover:text-emerald-700">Traceability</Link>
            <span>&bull;</span>
            <Link href="/impact" className="hover:text-emerald-700">Impact Targets</Link>
            <span>&bull;</span>
            <Link href="/login" className="hover:text-emerald-700">Demo Login</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
