/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { StatCard } from "@/components/ui/StatCard";
import { Truck, Thermometer, ShieldCheck, MapPin, CheckCircle2 } from "lucide-react";
import { LogisticsActions } from "@/components/logistics/LogisticsActions";

export default async function LogisticsPage() {
  let shipments: any[] = [];
  let pendingOrders: any[] = [];

  try {
    const results = await Promise.all([
      prisma.shipment.findMany({
        include: {
          order: {
            include: {
              buyerProfile: true,
              orderLines: {
                include: {
                  harvestLot: {
                    include: {
                      harvestRecord: {
                        include: { farmUnit: true, cropCycle: { include: { cropCatalogue: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
          driver: true,
          qualityInspection: true,
        },
        orderBy: { scheduledPickupTime: "desc" },
      }),
      prisma.order.findMany({
        where: {
          status: { in: ["RESERVED", "CONFIRMED"] },
          shipments: { none: {} },
        },
        include: {
          buyerProfile: true,
          orderLines: {
            include: {
              harvestLot: {
                include: {
                  harvestRecord: {
                    include: { farmUnit: true, cropCycle: { include: { cropCatalogue: true } } },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    shipments = results[0];
    pendingOrders = results[1];
  } catch (err) {
    console.warn("Database unavailable in LogisticsPage, using fallback shipments:", err);
  }

  if (shipments.length === 0) {
    const { FALLBACK_SHIPMENTS, FALLBACK_ORDERS } = await import("@/server/fallbackData");
    shipments = FALLBACK_SHIPMENTS;
    pendingOrders = FALLBACK_ORDERS;
  }

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Cold-Chain Logistics &amp; Fleet Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Refrigerated mini-vans, transit temperature logging, and farmgate-to-buyer quality handover.
          </p>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          title="Active Reefer Fleet"
          value="TS-03-EB-4192"
          subValue="1.5T Reefer Van"
          trendText="Warangal-Hyd Corridor"
          trendDirection="neutral"
          icon={Truck}
          iconBgColor="bg-sky-50"
          iconColor="text-sky-700"
        />

        <StatCard
          title="Cargo Temperature"
          value="4.2°C"
          subValue="Target: 3.5°C - 5.0°C"
          trendText="Zero thermal excursions"
          trendDirection="up"
          icon={Thermometer}
          iconBgColor="bg-teal-50"
          iconColor="text-teal-700"
        />

        <StatCard
          title="Quality Acceptance"
          value="100%"
          subValue="Direct farmgate handover"
          trendText="9.6 / 10 freshness score"
          trendDirection="up"
          icon={ShieldCheck}
          iconBgColor="bg-emerald-50"
          iconColor="text-emerald-700"
        />
      </div>

      {/* Active Shipments Table */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Shipment Tracking &amp; Cold Transit Log</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                GPS corridor tracking, cargo temperature telemetry, and delivery sign-off
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Shipment Code</th>
                    <th className="px-4 py-3">Vehicle &amp; Driver</th>
                    <th className="px-4 py-3">Origin &rarr; Destination</th>
                    <th className="px-4 py-3">Cargo Temp</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Inspection Handover</th>
                    <th className="px-4 py-3">Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E0]">
                  {shipments.map((s) => {
                    const line = s.order.orderLines[0];
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                          {s.shipmentCode}
                          <p className="text-[11px] text-slate-400 font-sans font-normal">
                            Order: {s.order.orderNumber}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#0F1D2F]">{s.vehicleNumber}</p>
                          <p className="text-[11px] text-slate-500">{s.vehicleType} &bull; {s.driver?.name || "Assigned Driver"}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-700">
                          <p className="font-medium text-[#0F1D2F] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            {s.pickupLocation}
                          </p>
                          <p className="text-[11px] text-slate-500 ml-4.5 mt-0.5">&rarr; {s.destination}</p>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-sky-800">
                          {s.temperatureLogC ?? 4.2}°C
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={s.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          {s.qualityInspection ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Grade-{s.qualityInspection.verifiedGrade} ({s.qualityInspection.acceptedQuantityKg} kg)
                            </span>
                          ) : (
                            <span className="text-slate-400 font-medium">Awaiting handover</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <LogisticsActions
                            shipment={{
                              id: s.id,
                              shipmentCode: s.shipmentCode,
                              status: s.status,
                              orderNumber: s.order.orderNumber,
                              orderedKg: line?.quantityKg ?? 50,
                              destination: s.destination,
                              temperatureLogC: s.temperatureLogC,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pickup Queue (Awaiting Cold-Chain Dispatch) */}
      <div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <span>Farmgate Pickup Queue (Orders Awaiting Fleet Assignment)</span>
                  <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                    {pendingOrders.length} Pending
                  </span>
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirmed buyer orders requiring scheduled reefer vehicle collection at farmgate
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pendingOrders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders pending pickup scheduling. All confirmed orders have assigned reefer fleet shipments.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3">Order Number</th>
                      <th className="px-4 py-3">Buyer Company</th>
                      <th className="px-4 py-3">Reserved Produce</th>
                      <th className="px-4 py-3">Farmgate Collection Point</th>
                      <th className="px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E0]">
                    {pendingOrders.map((ord) => {
                      const firstLine = ord.orderLines[0];
                      const lot = firstLine?.harvestLot;
                      const farm = lot?.harvestRecord?.farmUnit;
                      const crop = lot?.harvestRecord?.cropCycle?.cropCatalogue;
                      return (
                        <tr key={ord.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                            {ord.orderNumber}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-[#0F1D2F]">
                            {ord.buyerProfile.companyName}
                          </td>
                          <td className="px-4 py-3.5 text-slate-700">
                            {crop?.name || "Aggregated Produce"} &bull; {firstLine?.quantityKg} kg ({lot?.grade.replace("_", " ")})
                          </td>
                          <td className="px-4 py-3.5 text-slate-600">
                            <span className="font-semibold text-slate-800">{farm?.name || "Warangal Hub"}</span>
                            <span className="text-[11px] text-slate-400 block">{farm?.locationAddress || "Warangal North Cluster"}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <StatusBadge status={ord.status} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
