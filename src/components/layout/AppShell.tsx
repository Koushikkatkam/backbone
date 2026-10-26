import React from "react";
import { getCurrentUser } from "@/lib/session";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { PrototypeBanner } from "../ui/PrototypeBanner";

interface AppShellProps {
  children: React.ReactNode;
}

export async function AppShell({ children }: AppShellProps) {
  const currentUser = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9F6] text-[#0F1D2F]">
      <PrototypeBanner />
      <div className="flex flex-1">
        <Sidebar userRole={currentUser?.role} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header currentUser={currentUser} />
          <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
          <footer className="px-6 py-4 border-t border-[#E2E8E0] text-center text-xs text-slate-500 bg-white/50">
            <p>
              Project Backbone &copy; 2026 — Telangana Farmgate-to-Market Pilot Prototype (Warangal &amp; Mulugu).
              Self-contained demonstration build with simulated IoT telemetry, 24-hr instant settlements, and traceable harvest lots.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
