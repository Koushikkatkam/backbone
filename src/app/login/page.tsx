"use client";

import React, { useState } from "react";
import { DEMO_USERS, DemoUserOption } from "@/lib/constants";
import { PrototypeBanner } from "@/components/ui/PrototypeBanner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldCheck, UserCheck, Sprout } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignIn = async (user: DemoUserOption) => {
    setLoadingId(user.id);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/v1/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      if (res.ok) {
        window.location.assign(user.primaryActionUrl);
        return;
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.error || "Failed to activate demo identity. Please try again.");
      }
    } catch (error) {
      console.error("Sign-in failed", error);
      setErrorMessage("Network connectivity issue. Please reload and try again.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9F6] flex flex-col justify-between text-[#0F1D2F]">
      <PrototypeBanner />

      <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-600 hover:text-red-800 font-bold ml-4 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-[#1B532D] flex items-center justify-center text-white shadow-sm">
              <Sprout className="w-6 h-6 text-emerald-200" />
            </div>
            <span className="font-extrabold text-xl text-[#0F1D2F]">PROJECT BACKBONE</span>
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F1D2F]">
            Prototype Demonstration Sign-In
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl mx-auto">
            Select any of the six fictional roles below to activate the session in a secure HTTP cookie
            and test role-specific workflows and authorization.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_USERS.map((user) => (
            <Card key={user.id} hoverEffect className="flex flex-col justify-between">
              <CardHeader className="bg-slate-50/60">
                <div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${user.badgeColor}`}>
                    {user.role}
                  </span>
                  <CardTitle className="mt-2 text-base">{user.name}</CardTitle>
                  <CardDescription className="text-emerald-800 font-medium">
                    {user.roleTitle}
                  </CardDescription>
                </div>
                <div className="w-10 h-10 rounded-full bg-[#0F1D2F] text-emerald-300 flex items-center justify-center font-bold text-sm shrink-0">
                  {user.avatar}
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pt-4">
                <p className="text-xs text-slate-600 leading-relaxed min-h-[48px]">
                  {user.bio}
                </p>

                <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                  {user.email}
                </div>

                <Button
                  onClick={() => handleSignIn(user)}
                  isLoading={loadingId === user.id}
                  variant={user.role === "ADMIN" ? "secondary" : "primary"}
                  className="w-full text-xs font-semibold"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Launch as {user.name.split(" ")[0]}</span>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Security & Prototype Disclosure */}
        <div className="mt-12 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-950">Prototype Authentication Notice</p>
            <p className="mt-0.5 text-amber-800 leading-relaxed">
              This selector is designed specifically for client walkthroughs, stakeholder demos, and automated testing.
              It sets a server-side session cookie mapped to pre-seeded demo identities.
              Production authentication (OAuth2 / OTP) will be bound in post-pilot deployment.
            </p>
          </div>
        </div>
      </div>

      <footer className="py-6 border-t border-[#E2E8E0] text-center text-xs text-slate-500 bg-white">
        Project Backbone &copy; 2026 — Telangana Agricultural Operations Network.
      </footer>
    </div>
  );
}
