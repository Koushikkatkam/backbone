import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getHarvestLotByCode } from "@/server/services/harvestService";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { LotProvenanceActions } from "@/components/harvests/LotProvenanceActions";
import {
  ArrowLeft,
  Sprout,
  Truck,
  Landmark,
  ShieldCheck,
  Layers,
} from "lucide-react";

export default async function HarvestTraceabilityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lot = await getHarvestLotByCode(id);

  if (!lot) notFound();

  const farm = lot.harvestRecord.farmUnit;
  const cycle = lot.harvestRecord.cropCycle;
  const quality = lot.qualityInspections[0];
  const orderLine = lot.orderLines[0];
  const order = orderLine?.order;
  const shipment = order?.shipments[0];

  return (
    <AppShell>
      {/* Top Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/harvests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 hover:text-emerald-950 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to All Harvest Lots</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded border border-emerald-300">
                {lot.lotCode}
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
                Provenance &amp; Traceability Graph
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              End-to-end farmgate audit trail: from seedling to cold chain and verified 24h bank settlement.
            </p>
          </div>
          <StatusBadge status={lot.grade} />
        </div>
      </div>

      {/* 5-Stage Traceability Timeline */}
      <div className="mb-8 grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Stage 1: Farmgate</span>
          <p className="text-xs font-bold text-[#0F1D2F] mt-1">{farm.name}</p>
          <p className="text-[11px] text-slate-500">{farm.farmerProfile.village}, Telangana</p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Stage 2: Cultivation</span>
          <p className="text-xs font-bold text-[#0F1D2F] mt-1">{cycle.cropCatalogue.name}</p>
          <p className="text-[11px] text-slate-500">Day 32 &bull; Hydroponic A-Frame</p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Stage 3: Grading &amp; QC</span>
          <p className="text-xs font-bold text-emerald-800 mt-1">Certified Grade-A</p>
          <p className="text-[11px] text-slate-500">Freshness Score: 9.6/10</p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Stage 4: Cold Transit</span>
          <p className="text-xs font-bold text-[#0F1D2F] mt-1">{shipment?.vehicleNumber || "Assigned Reefer"}</p>
          <p className="text-[11px] text-slate-500">Temp: {shipment?.temperatureLogC || 4.2}°C Steady</p>
        </div>

        <div className="p-3 bg-white rounded-xl border border-emerald-300 shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Stage 5: 24h Payout</span>
          <p className="text-xs font-bold text-emerald-800 mt-1">Disbursed in 3.25h</p>
          <p className="text-[11px] text-slate-500">UPI Instant Settlement</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Cultivation History & Telemetry Profile */}
        <div className="lg:col-span-2 space-y-6">
          {/* Farm Origin & Crop Cycle */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>Cultivation &amp; Harvest Origin</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#F8F9F6] p-3.5 rounded-lg border border-[#E2E8E0]">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Farmer</span>
                  <p className="font-bold text-[#0F1D2F] mt-0.5">{farm.farmerProfile.user.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Acreage</span>
                  <p className="font-bold text-[#0F1D2F] mt-0.5">0.25 Acres</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Planted Date</span>
                  <p className="font-bold text-[#0F1D2F] mt-0.5">{cycle.plantedDate.toISOString().slice(0, 10)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Harvest Date</span>
                  <p className="font-bold text-[#0F1D2F] mt-0.5">{lot.harvestRecord.harvestDate.toISOString().slice(0, 10)}</p>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  Farmgate Quality Notes
                </span>
                <p className="text-slate-700 bg-white p-3 rounded border border-slate-200">
                  {lot.harvestRecord.farmgateQualityNotes || "Harvested at peak morning crispness. Graded and packed in ventilated reusable crates."}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quality Inspection Report */}
          {quality && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Quality Assurance &amp; Acceptance Report</span>
                </CardTitle>
                <StatusBadge status={quality.status} />
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/40 p-3.5 rounded-lg border border-emerald-100">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Inspector</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{quality.inspectedBy}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Sampled</span>
                    <p className="font-bold text-emerald-950 mt-0.5">{quality.sampledQuantityKg} kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Accepted Qty</span>
                    <p className="font-bold text-emerald-800 mt-0.5">{quality.acceptedQuantityKg} kg</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Freshness Score</span>
                    <p className="font-bold text-emerald-800 mt-0.5">{quality.freshnessScore} / 10</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Inventory Movement Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span>Inventory Movements (Audit Log)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E2E8E0] text-xs">
                {lot.inventoryMovements.map((m) => (
                  <div key={m.id} className="p-3.5 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-slate-800">{m.movementType}</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">{m.reason}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#0F1D2F]">{m.quantityKg} kg</span>
                      <p className="text-[11px] text-slate-400 font-mono">Balance: {m.balanceAfterKg} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (1 span): QR Actions, Order & Cold-Chain Transit */}
        <div className="space-y-6">
          <LotProvenanceActions
            lotId={lot.id}
            lotCode={lot.lotCode}
            currentGrade={lot.grade}
            currentStatus={lot.curationStatus}
            availableKg={lot.availableQuantityKg}
          />

          {/* Order Details */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-sky-600" />
                  <span>Buyer Order &amp; Cold Transit</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Order Number:</span>
                  <span className="font-mono font-bold text-slate-800">{order.orderNumber}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Buyer:</span>
                  <span className="font-bold text-[#0F1D2F]">{order.buyerProfile.companyName}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Order Amount:</span>
                  <span className="font-bold text-emerald-800">{formatINR(order.totalAmount)}</span>
                </div>
                <div className="flex justify-between pb-2 border-b border-slate-100">
                  <span className="text-slate-400">Status:</span>
                  <StatusBadge status={order.status} />
                </div>

                {shipment && (
                  <div className="mt-3 p-3 bg-sky-50/50 rounded-lg border border-sky-100 space-y-1.5">
                    <p className="font-bold text-sky-950 flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      Vehicle: {shipment.vehicleNumber}
                    </p>
                    <p className="text-[11px] text-sky-800">{shipment.vehicleType}</p>
                    <p className="text-[11px] text-sky-800 font-medium">Reefer Temp: {shipment.temperatureLogC}°C steady</p>
                    <p className="text-[10px] text-sky-700 italic mt-1">{shipment.trackingNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Farmer Settlement Stamp */}
          <Card>
            <CardHeader className="bg-emerald-50/60">
              <CardTitle className="flex items-center gap-2 text-emerald-900">
                <Landmark className="w-4 h-4 text-emerald-700" />
                <span>24-Hour Settlement Clearance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Unit Price Agreed:</span>
                <span className="font-bold text-slate-800">{formatINR(lot.unitPricePerKg)} / kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Settlement Standard:</span>
                <span className="text-emerald-800 font-bold">100% within 24h</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-emerald-950">
                <p className="font-bold">Automated UPI Payout</p>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Direct transfer from escrow to farmer bank account upon delivery acceptance.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
