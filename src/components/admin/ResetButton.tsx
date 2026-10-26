"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function ResetButton() {
  const router = useRouter();
  const [isResetting, setIsResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const handleResetDatabase = async () => {
    if (
      !confirm(
        "Are you sure you want to re-seed the prototype database? All active test reservations and settlements will be restored to the standard pilot seed."
      )
    ) {
      return;
    }

    setIsResetting(true);
    setResetMessage(null);

    try {
      const res = await fetch("/api/v1/admin/reset", { method: "POST" });
      const data = await res.json();

      if (data.success) {
        setResetMessage("Database reset successfully! Telangana pilot seed data restored.");
        router.refresh();
      } else {
        setResetMessage(`Reset failed: ${data.error}`);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setResetMessage(`Error triggering reset: ${message}`);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-4">
      {resetMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{resetMessage}</span>
        </div>
      )}

      <Button
        onClick={handleResetDatabase}
        isLoading={isResetting}
        variant="gold"
        className="w-full text-xs font-semibold"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Restore Deterministic Seed Data</span>
      </Button>
    </div>
  );
}
