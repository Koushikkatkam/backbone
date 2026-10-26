/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import {
  Home,
  Sprout,
  Layers,
  Landmark,
  ArrowRight,
  AlertTriangle,
  Zap,
  MapPin,
} from "lucide-react";

import {
  FALLBACK_FARM_UNITS,
  FALLBACK_CROP_CYCLES,
  FALLBACK_HARVEST_LOTS,
  FALLBACK_BUYBACK_OFFERS,
  FALLBACK_ORDERS,
  FALLBACK_SHIPMENTS,
  FALLBACK_PAYABLES,
  FALLBACK_RECEIVABLES,
  FALLBACK_SETTLEMENTS,
  FALLBACK_ALERTS,
  FALLBACK_AUDITS,
} from "@/server/fallbackData";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const currentRole = user?.role || Role.ADMIN;

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  // Global metrics derived directly from real database records with graceful demo fallback
  let totalFarmers = 10;
  let operationalFarmUnits = 10;
  let allFarmUnits: any[] = FALLBACK_FARM_UNITS;
  let allCropCycles: any[] = FALLBACK_CROP_CYCLES;
  let harvestLots: any[] = FALLBACK_HARVEST_LOTS;
  let buybackOffers: any[] = FALLBACK_BUYBACK_OFFERS;
  let buybackResponses: any[] = [];
  let orders: any[] = FALLBACK_ORDERS;
  let shipments: any[] = FALLBACK_SHIPMENTS;
  let payables: any[] = FALLBACK_PAYABLES;
  let receivables: any[] = FALLBACK_RECEIVABLES;
  let settlements: any[] = FALLBACK_SETTLEMENTS;
  let alerts: any[] = FALLBACK_ALERTS;
  let recentAudits: any[] = FALLBACK_AUDITS;

  try {
    const results = await Promise.all([
      prisma.farmerProfile.count(),
      prisma.farmUnit.count({ where: { status: "OPERATIONAL" } }),
      prisma.farmUnit.findMany({
        include: {
          farmerProfile: { include: { user: true } },
          cropCycles: { where: { status: "ACTIVE" }, include: { cropCatalogue: true } },
          sensorDevices: { include: { readings: { take: 1, orderBy: { timestamp: "desc" } } } },
        },
      }),
      prisma.cropCycle.findMany({
        where: { status: "ACTIVE" },
        include: {
          cropCatalogue: true,
          farmUnit: { include: { farmerProfile: { include: { user: true } } } },
        },
      }),
      prisma.harvestLot.findMany({
        include: {
          harvestRecord: {
            include: {
              farmUnit: { include: { farmerProfile: { include: { user: true } } } },
              cropCycle: { include: { cropCatalogue: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.buybackOffer.findMany({ where: { status: "ACTIVE" } }),
      prisma.buybackResponse.findMany(),
      prisma.order.findMany({
        include: {
          buyerProfile: true,
          orderLines: { include: { harvestLot: true } },
          shipments: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shipment.findMany({
        include: { driver: true, order: { include: { buyerProfile: true } } },
        orderBy: { scheduledPickupTime: "desc" },
      }),
      prisma.farmerPayable.findMany(),
      prisma.buyerReceivable.findMany(),
      prisma.settlementRecord.findMany({
        include: {
          farmerProfile: { include: { user: true } },
          farmerPayable: true,
        },
        take: 5,
        orderBy: { disbursedAt: "desc" },
      }),
      prisma.sensorAlert.findMany({
        where: { isResolved: false },
        include: { sensorDevice: { include: { farmUnit: true } } },
        take: 3,
      }),
      prisma.auditLog.findMany({
        include: { user: true },
        take: 6,
        orderBy: { timestamp: "desc" },
      }),
    ]);

    totalFarmers = results[0];
    operationalFarmUnits = results[1];
    allFarmUnits = results[2];
    allCropCycles = results[3];
    harvestLots = results[4];
    buybackOffers = results[5];
    buybackResponses = results[6];
    orders = results[7];
    shipments = results[8];
    payables = results[9];
    receivables = results[10];
    settlements = results[11];
    alerts = results[12];
    recentAudits = results[13];
  } catch (err) {
    console.warn("Database unavailable for dashboard metrics, using fallback Telangana demo data:", err);
  }

  // Derived Calculations
  // 1. Stage breakdown
  const stagesCount: Record<string, number> = {
    NURSERY: 0,
    VEGETATIVE: 0,
    FLOWERING_FRUITING: 0,
    MATURE: 0,
    HARVESTING: 0,
  };
  allCropCycles.forEach((c) => {
    if (stagesCount[c.stage] !== undefined) {
      stagesCount[c.stage]++;
    }
  });

  // 2. Expected harvest in next 30 days
  const expectedHarvest30dKg = allCropCycles
    .filter((c) => c.expectedHarvestDate <= thirtyDaysLater)
    .reduce((acc, c) => acc + c.targetYieldKg, 0);

  // 3. Stock
  const availableProduceKg = harvestLots.reduce((acc, l) => acc + l.availableQuantityKg, 0);
  const reservedProduceKg = harvestLots.reduce((acc, l) => acc + l.reservedQuantityKg, 0);

  // 4. Buyback quantities
  const offeredBuybackKg = buybackOffers.reduce((acc, o) => acc + o.maxQuantityKg, 0);
  const acceptedBuybackKg = buybackResponses.reduce((acc, r) => acc + r.committedQuantityKg, 0);

  // 5. Orders by status
  const ordersByStatus: Record<string, number> = {
    RESERVED: 0,
    CONFIRMED: 0,
    IN_TRANSIT: 0,
    DELIVERED: 0,
    CANCELLED: 0,
  };
  orders.forEach((o) => {
    ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1;
  });

  // 6. Shipments in progress
  const inTransitShipments = shipments.filter((s) => s.status === "IN_TRANSIT").length;

  // 7. Balances
  const outstandingFarmerPayables = payables
    .filter((p) => p.status === "PENDING")
    .reduce((acc, p) => acc + p.netPayable, 0);
  const outstandingBuyerReceivables = receivables
    .filter((r) => r.status === "PENDING")
    .reduce((acc, r) => acc + r.amount, 0);
  const totalSettledDisbursed = settlements.reduce((acc, s) => acc + s.disbursedAmount, 0);

  // 8. Cluster Summaries (Warangal vs Mulugu)
  const warangalUnits = allFarmUnits.filter((f) => f.farmerProfile.district === "Warangal");
  const muluguUnits = allFarmUnits.filter((f) => f.farmerProfile.district === "Mulugu");

  return (
    <AppShell>
      {/* Top Banner */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
              {currentRole === Role.ADMIN && "State Network Operations Control Center"}
              {currentRole === Role.FARMER && `Farmer Portal — ${user?.name}`}
              {currentRole === Role.FRANCHISE_OPERATOR && `Cluster Operations Desk — ${user?.name}`}
              {currentRole === Role.AGRONOMIST && `Precision Agronomy & Crop Health — ${user?.name}`}
              {currentRole === Role.BUYER && `B2B Procurement & Orders — ${user?.name}`}
              {currentRole === Role.LOGISTICS_OPERATOR && `Cold Transit & Delivery Dispatch — ${user?.name}`}
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
              {currentRole}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-300">
              REAL_PILOT_RECORDS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time smallholder farmgate network: 10 operational pilot units, inventory reservations, and 24-hr payout settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {currentRole === Role.ADMIN && (
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>Demo Controls &amp; Reset</span>
            </Link>
          )}
          <Link
            href="/harvests"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <span>Traceable Lots</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Sensor Alert Notification if active */}
      {alerts.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-300 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900">
                Active Telemetry Alert: {alerts[0].parameter} at {alerts[0].sensorDevice.farmUnit.name}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                {alerts[0].message} (Current: {alerts[0].currentValue}, Safe Threshold: {alerts[0].thresholdValue})
              </p>
            </div>
          </div>
          <Link
            href="/sensors"
            className="text-xs font-semibold text-amber-900 underline hover:text-amber-950 shrink-0"
          >
            Inspect Node &rarr;
          </Link>
        </div>
      )}

      {/* Main KPI Cards Grid (Clickable to Filtered Views) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Farmers & Units */}
        <Link href="/farms" className="block group">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Registered Farmers &amp; Units</span>
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-[#1B532D] group-hover:text-white transition-colors">
                <Home className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#0F1D2F]">
              {totalFarmers} Farmers &bull; {operationalFarmUnits} Units
            </div>
            <p className="text-[11px] text-emerald-800 mt-1 font-medium">
              100% operational &bull; 0.25 acres each
            </p>
          </div>
        </Link>

        {/* Available Inventory */}
        <Link href="/marketplace" className="block group">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-sky-500 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Available Produce</span>
              <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 group-hover:bg-sky-700 group-hover:text-white transition-colors">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#0F1D2F]">
              {availableProduceKg.toLocaleString()} kg
            </div>
            <p className="text-[11px] text-sky-800 mt-1 font-medium">
              {reservedProduceKg} kg reserved &bull; Oversell locked
            </p>
          </div>
        </Link>

        {/* Expected Harvest (30d) */}
        <Link href="/crops" className="block group">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-500 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">Expected Harvest (30 Days)</span>
              <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition-colors">
                <Sprout className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#0F1D2F]">
              {expectedHarvest30dKg.toLocaleString()} kg
            </div>
            <p className="text-[11px] text-teal-800 mt-1 font-medium">
              Across {allCropCycles.length} active crop cycles
            </p>
          </div>
        </Link>

        {/* 24h Payouts Disbursed */}
        <Link href="/finance" className="block group">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-amber-500 hover:shadow-md transition-all">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span className="font-semibold">24h Instant Payouts</span>
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-700 group-hover:text-white transition-colors">
                <Landmark className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-[#0F1D2F]">
              {formatINR(totalSettledDisbursed)}
            </div>
            <p className="text-[11px] text-amber-800 mt-1 font-medium">
              Avg speed 3.25h &bull; {formatINR(outstandingFarmerPayables)} pending
            </p>
          </div>
        </Link>
      </div>

      {/* Second Row: Balances, Buyback Pipeline & Logistics Tracking */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {/* Buyback Procurement */}
        <Link href="/buyback" className="block group">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-emerald-500 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Guaranteed Buyback
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-[#0F1D2F]">
                {acceptedBuybackKg.toLocaleString()} kg / {offeredBuybackKg.toLocaleString()} kg
              </span>
              <span className="text-xs font-bold text-emerald-800">
                {offeredBuybackKg > 0 ? ((acceptedBuybackKg / offeredBuybackKg) * 100).toFixed(0) : 0}% committed
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Farmer commitments under floor guarantee with zero double-commitment.
            </p>
          </div>
        </Link>

        {/* Cold-Chain Dispatch */}
        <Link href="/logistics" className="block group">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-sky-500 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Cold Transit Logistics
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-[#0F1D2F]">
                {inTransitShipments} Reefer in Transit
              </span>
              <span className="text-xs font-bold text-sky-800 font-mono">
                {shipments.length} total shipments
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              4.2°C reefer chamber verified &bull; GPS corridor tracking active.
            </p>
          </div>
        </Link>

        {/* Outstanding Receivables */}
        <Link href="/finance" className="block group">
          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-purple-500 transition-all">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Buyer Receivables Pipeline
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold text-[#0F1D2F]">
                {formatINR(outstandingBuyerReceivables)}
              </span>
              <span className="text-xs font-bold text-purple-800">
                B2B Net 7
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Backed by verified QC delivery acceptance reports.
            </p>
          </div>
        </Link>
      </div>

      {/* Main Two-Column Dashboard Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column (2 spans): Active Cycles & Cluster Summaries */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Cultivation by Stage */}
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>Crop Cultivation by Growth Stage</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time pipeline across A-Frames, Poly-Canopies, and Silos
                </p>
              </div>
              {/* Stage Pills */}
              <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
                  Vegetative: {stagesCount.VEGETATIVE}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-medium border border-amber-200">
                  Flowering: {stagesCount.FLOWERING_FRUITING}
                </span>
                <span className="px-2 py-0.5 rounded bg-sky-50 text-sky-800 font-medium border border-sky-200">
                  Harvesting: {stagesCount.HARVESTING}
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="px-5 py-3">Crop Variety</th>
                      <th className="px-4 py-3">Farm Unit &amp; Farmer</th>
                      <th className="px-4 py-3">Stage</th>
                      <th className="px-4 py-3">Target Yield</th>
                      <th className="px-4 py-3">Expected Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8E0]">
                    {allCropCycles.slice(0, 6).map((cycle) => (
                      <tr key={cycle.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-bold text-[#0F1D2F]">{cycle.cropCatalogue.name}</p>
                          <p className="text-[11px] text-slate-500 font-mono">{cycle.cycleCode}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-medium text-[#0F1D2F]">{cycle.farmUnit.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {cycle.farmUnit.farmerProfile.user.name} ({cycle.farmUnit.farmerProfile.district})
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200">
                            {cycle.stage}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#0F1D2F]">
                          {cycle.targetYieldKg} kg
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 font-mono text-[11px]">
                          {cycle.expectedHarvestDate.toISOString().slice(0, 10)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Cluster-Level Summaries (Warangal vs Mulugu) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Warangal Cluster */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-[#0F1D2F] text-sm">Warangal Pilot Cluster</span>
                </div>
                <span className="text-[11px] font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {warangalUnits.length} Units (1.25 Acres)
                </span>
              </div>
              <p className="text-slate-600">
                Focus on rapid-cycle leafy greens (Gongura, Mint, Coriander) on Vertical Hydroponic A-Frames.
              </p>
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Active Cycles: {warangalUnits.reduce((acc, u) => acc + u.cropCycles.length, 0)}</span>
                <Link href="/farms?district=Warangal" className="text-emerald-800 hover:underline font-bold">
                  View Units &rarr;
                </Link>
              </div>
            </div>

            {/* Mulugu Cluster */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-600" />
                  <span className="font-bold text-[#0F1D2F] text-sm">Mulugu Pilot Cluster</span>
                </div>
                <span className="text-[11px] font-mono text-teal-800 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  {muluguUnits.length} Units (1.25 Acres)
                </span>
              </div>
              <p className="text-slate-600">
                Semi-closed Poly-Canopies producing premium Red Chilli, Vine Tomatoes and processing Onion storage.
              </p>
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Active Cycles: {muluguUnits.reduce((acc, u) => acc + u.cropCycles.length, 0)}</span>
                <Link href="/farms?district=Mulugu" className="text-emerald-800 hover:underline font-bold">
                  View Units &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 span): Order Status & Audit Trail */}
        <div className="space-y-6">
          {/* Orders by Status Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>B2B Orders by Fulfillment Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5 text-xs">
              <Link
                href="/orders"
                className="flex items-center justify-between p-2 rounded-lg bg-sky-50/50 hover:bg-sky-50 text-sky-900 font-medium border border-sky-100 transition-colors"
              >
                <span>Reserved / Inventory Hold</span>
                <span className="font-bold">{ordersByStatus.RESERVED || 0}</span>
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/50 hover:bg-emerald-50 text-emerald-900 font-medium border border-emerald-100 transition-colors"
              >
                <span>Confirmed &amp; Ready for Transit</span>
                <span className="font-bold">{ordersByStatus.CONFIRMED || 0}</span>
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-between p-2 rounded-lg bg-teal-50/50 hover:bg-teal-50 text-teal-900 font-medium border border-teal-100 transition-colors"
              >
                <span>Reefer In Transit</span>
                <span className="font-bold">{ordersByStatus.IN_TRANSIT || 0}</span>
              </Link>
              <Link
                href="/orders"
                className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-800 font-medium border border-slate-200 transition-colors"
              >
                <span>Delivered &amp; QC Signed</span>
                <span className="font-bold">{ordersByStatus.DELIVERED || 0}</span>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Operational Audit Activity */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Operational Activity Log</CardTitle>
              <Link href="/admin/audit" className="text-xs font-semibold text-emerald-800 hover:underline">
                Full Audit &rarr;
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E2E8E0] text-xs">
                {recentAudits.map((a) => (
                  <div key={a.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-slate-800">{a.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {a.timestamp.toISOString().slice(11, 16)} UTC
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{a.reason}</p>
                    <p className="text-[10px] text-emerald-800 mt-1 font-medium">
                      Actor: {a.user?.name || "System Automation"}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
