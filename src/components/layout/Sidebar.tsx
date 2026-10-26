"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAVIGATION_ITEMS } from "@/lib/constants";
import { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Home,
  Cpu,
  Sprout,
  Activity,
  BookOpenCheck,
  Layers,
  HandCoins,
  Store,
  ShoppingBag,
  Truck,
  Landmark,
  TrendingUp,
  Bell,
  ShieldAlert,
  Settings,
  Menu,
  X,
  Sprout as BrandIcon,
} from "lucide-react";

interface SidebarProps {
  userRole?: Role;
  className?: string;
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Home,
  Cpu,
  Sprout,
  Activity,
  BookOpenCheck,
  Layers,
  HandCoins,
  Store,
  ShoppingBag,
  Truck,
  Landmark,
  TrendingUp,
  Bell,
  ShieldAlert,
  Settings,
};

export function Sidebar({ userRole = Role.ADMIN, className = "" }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const allowedNav = NAVIGATION_ITEMS.filter((item) =>
    item.allowedRoles.includes(userRole)
  );

  const renderNavList = () => (
    <div className="flex flex-col h-full bg-[#0F1D2F] text-slate-200 border-r border-[#1E2E42]">
      {/* Brand Header */}
      <div className="p-5 border-b border-[#1E2E42] flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-3 group"
          onClick={() => setMobileOpen(false)}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-[#1B532D] flex items-center justify-center text-white shadow-md shadow-emerald-950/40 group-hover:scale-105 transition-transform">
            <BrandIcon className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block leading-none">
              PROJECT BACKBONE
            </span>
            <span className="text-[10px] text-emerald-400 font-mono tracking-wider block mt-1">
              TELANGANA AGRI-NET
            </span>
          </div>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden text-slate-400 hover:text-white p-1"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Pill Banner */}
      <div className="px-5 py-3 bg-[#08111E]/80 border-b border-[#1E2E42]/80 flex items-center justify-between text-xs">
        <span className="text-slate-400 text-[11px]">Active Persona:</span>
        <span className="font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] tracking-wide">
          {userRole}
        </span>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Operations &amp; Modules
        </div>
        {allowedNav.map((item) => {
          const Icon = iconMap[item.iconName] || LayoutDashboard;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? "bg-[#1B532D] text-white shadow-sm shadow-emerald-950/50"
                  : "text-slate-300 hover:bg-[#182C44] hover:text-white"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? "text-emerald-300" : "text-slate-400 group-hover:text-slate-300"
                }`}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pilot Cluster Footnote */}
      <div className="p-4 border-t border-[#1E2E42] bg-[#08111E]/50 text-[11px] text-slate-400">
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Warangal &amp; Mulugu</span>
          <span className="text-emerald-400 font-mono">10 Units</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-1">
          Self-contained SQLite proto. Clean PG migration path enabled.
        </p>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-30 p-2 rounded-lg bg-[#0F1D2F] text-white shadow-md border border-[#1E2E42] cursor-pointer"
        aria-label="Open sidebar menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <aside className={`hidden lg:block w-64 h-screen sticky top-0 shrink-0 z-20 ${className}`}>
        {renderNavList()}
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] h-full shadow-2xl z-50 animate-in slide-in-from-left duration-200">
            {renderNavList()}
          </div>
        </div>
      )}
    </>
  );
}
