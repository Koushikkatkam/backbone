"use client";

import React from "react";
import Link from "next/link";
import { DemoAccountSwitcher } from "./DemoAccountSwitcher";
import { HeaderSearch } from "./HeaderSearch";
import { Bell, ShieldCheck } from "lucide-react";
import { Role } from "@prisma/client";

interface HeaderProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
  unreadCount?: number;
}

export function Header({ currentUser, unreadCount = 3 }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-[#E2E8E0] px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Left Context & Search */}
      <div className="flex items-center gap-4 flex-1 max-w-lg pl-10 lg:pl-0">
        <HeaderSearch />
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Mock status indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Mock Integrations Active</span>
        </div>

        {/* Notifications Icon */}
        <Link
          href="/notifications"
          className="relative p-2 rounded-lg text-slate-500 hover:text-[#0F1D2F] hover:bg-slate-100 transition-colors"
          aria-label="View notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white"></span>
          )}
        </Link>

        {/* 1-Click Role Switcher */}
        <DemoAccountSwitcher currentUser={currentUser} />
      </div>
    </header>
  );
}
