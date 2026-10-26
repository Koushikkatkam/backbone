import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Bell, AlertTriangle, Landmark, Truck, BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { MarkAllReadButton } from "@/components/notifications/NotificationActions";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  const notifications = await prisma.notification.findMany({
    where: user?.role === "ADMIN" ? {} : { userId: user?.id },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Operational Notifications &amp; Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time automated broadcasts for bank disbursements, sensor anomalies, and cold-chain shipments.
          </p>
        </div>

        <MarkAllReadButton />
      </div>

      <div className="space-y-4">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-xl border transition-all text-xs flex items-start gap-3.5 ${
              n.isRead
                ? "bg-white border-[#E2E8E0] text-slate-600"
                : "bg-emerald-50/30 border-emerald-200 text-[#0F1D2F] shadow-xs"
            }`}
          >
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-[#1B532D] shrink-0 mt-0.5">
              {n.type === "SETTLEMENT" && <Landmark className="w-4 h-4 text-emerald-700" />}
              {n.type === "ALERT" && <AlertTriangle className="w-4 h-4 text-amber-600" />}
              {n.type === "SHIPMENT" && <Truck className="w-4 h-4 text-sky-600" />}
              {n.type === "ADVISORY" && <BookOpenCheck className="w-4 h-4 text-purple-600" />}
              {n.type === "SYSTEM" && <Bell className="w-4 h-4 text-slate-600" />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-[#0F1D2F]">{n.title}</h3>
                <span className="font-mono text-[11px] text-slate-400">
                  {n.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
              <div className="mt-2.5 flex items-center justify-between">
                <span className="text-[11px] font-medium text-emerald-800">
                  Recipient: {n.user.name} ({n.user.role})
                </span>
                {n.link && (
                  <Link
                    href={n.link}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-950 underline"
                  >
                    View Details &rarr;
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
