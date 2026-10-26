"use client";

import React, { useState } from "react";
import { DEMO_USERS, DemoUserOption } from "@/lib/constants";
import { UserCheck, ChevronDown, Check, ShieldAlert } from "lucide-react";
import { Role } from "@prisma/client";

interface DemoAccountSwitcherProps {
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: Role;
  } | null;
}

export function DemoAccountSwitcher({ currentUser }: DemoAccountSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const activeDemoUser =
    DEMO_USERS.find((u) => u.id === currentUser?.id || u.role === currentUser?.role) ||
    DEMO_USERS[0];

  const handleSwitchUser = async (user: DemoUserOption) => {
    setIsSwitching(true);
    try {
      const res = await fetch("/api/v1/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        setIsOpen(false);
        window.location.assign(user.primaryActionUrl);
        return;
      }
    } catch (err) {
      console.error("Error switching user:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-xs text-left cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="w-7 h-7 rounded-full bg-[#1B532D] text-white flex items-center justify-center font-bold text-xs ring-2 ring-emerald-500/20">
          {activeDemoUser.avatar}
        </div>
        <div className="hidden sm:block">
          <p className="text-xs font-semibold text-[#0F1D2F] leading-tight flex items-center gap-1.5">
            {currentUser?.name || activeDemoUser.name}
            <span className="text-[10px] font-medium text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-sm border border-emerald-300">
              {currentUser?.role || activeDemoUser.role}
            </span>
          </p>
          <p className="text-[11px] text-slate-500 truncate max-w-[140px] leading-tight">
            {activeDemoUser.roleTitle}
          </p>
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-84 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#0F1D2F] uppercase tracking-wider flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#1B532D]" />
                  Switch Demo Persona
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.5 rounded font-medium">
                  6 Pilot Roles
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Select any fictional role to test role-specific workflows & server permissions.
              </p>
            </div>

            <div className="p-1.5 max-h-96 overflow-y-auto space-y-1">
              {DEMO_USERS.map((u) => {
                const isActive =
                  (currentUser?.id && u.id === currentUser.id) ||
                  (!currentUser?.id && u.role === currentUser?.role);

                return (
                  <button
                    key={u.id}
                    onClick={() => handleSwitchUser(u)}
                    disabled={isSwitching}
                    className={`w-full text-left p-2.5 rounded-lg flex items-start gap-3 transition-colors cursor-pointer ${
                      isActive
                        ? "bg-emerald-50/70 border border-emerald-200"
                        : "hover:bg-slate-50 border border-transparent"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                        isActive
                          ? "bg-[#1B532D] text-white"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#0F1D2F] truncate">
                          {u.name}
                        </span>
                        {isActive && (
                          <Check className="w-3.5 h-3.5 text-emerald-700" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${u.badgeColor}`}>
                          {u.role}
                        </span>
                        <span className="text-[10px] text-slate-500 truncate">
                          {u.roleTitle}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                        {u.bio}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/60 rounded-b-xl flex items-center gap-1.5 text-[10px] text-slate-500">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Demo access only. Session stored in secure cookie.</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
