/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Bell, AlertTriangle, Landmark, Truck, BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { MarkAllReadButton } from "@/components/notifications/NotificationActions";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  let notifications: any[] = [];
  try {
    notifications = await prisma.notification.findMany({
      where: user?.role === "ADMIN" ? {} : { userId: user?.id },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.warn("Database unavailable in NotificationsPage, using fallback notifications:", err);
  }

  if (notifications.length === 0) {
    const { FALLBACK_NOTIFICATIONS } = await import("@/server/fallbackData");
    notifications = FALLBACK_NOTIFICATIONS;
  }

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
        {notifications.map((n) => {
          const createdAtStr = n.createdAt
            ? (n.createdAt instanceof Date ? n.createdAt : new Date(n.createdAt)).toISOString().slice(0, 16).replace("T", " ")
            : "Just now";
          const recipientName = n.user?.name || user?.name || "System Broadcast";
          const recipientRole = n.user?.role || user?.role || "ALL";
          const isSettlement = n.type === "SETTLEMENT" || n.category === "FINANCE";
          const isAlert = n.type === "ALERT" || n.category === "SENSOR";
          const isShipment = n.type === "SHIPMENT" || n.category === "LOGISTICS";
          const isAdvisory = n.type === "ADVISORY" || n.category === "AGRONOMY";

          return (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all text-xs flex items-start gap-3.5 ${
                n.isRead
                  ? "bg-white border-[#E2E8E0] text-slate-600"
                  : "bg-emerald-50/30 border-emerald-200 text-[#0F1D2F] shadow-xs"
              }`}
            >
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-[#1B532D] shrink-0 mt-0.5">
                {isSettlement && <Landmark className="w-4 h-4 text-emerald-700" />}
                {isAlert && <AlertTriangle className="w-4 h-4 text-amber-600" />}
                {isShipment && <Truck className="w-4 h-4 text-sky-600" />}
                {isAdvisory && <BookOpenCheck className="w-4 h-4 text-purple-600" />}
                {!isSettlement && !isAlert && !isShipment && !isAdvisory && (
                  <Bell className="w-4 h-4 text-slate-600" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-[#0F1D2F]">{n.title}</h3>
                  <span className="font-mono text-[11px] text-slate-400">
                    {createdAtStr}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-emerald-800">
                    Recipient: {recipientName} ({recipientRole})
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
          );
        })}
      </div>
    </AppShell>
  );
}
