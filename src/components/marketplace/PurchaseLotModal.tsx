"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, X, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface PurchaseLotModalProps {
  lot: {
    id: string;
    lotCode: string;
    grade: string;
    availableQuantityKg: number;
    unitPricePerKg: number;
    cropName: string;
    farmName: string;
    location: string;
  };
}

export function PurchaseLotModal({ lot }: PurchaseLotModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);

  const [quantityKg, setQuantityKg] = useState<number>(Math.min(50, lot.availableQuantityKg));
  const [deliveryAddress, setDeliveryAddress] = useState(
    "ITC Agri-Business Division, Hyderabad Cold Hub, Telangana 500081"
  );
  const [deliveryDate, setDeliveryDate] = useState(() => {
    const d = new Date(Date.now() + 3 * 24 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  });
  const [notes, setNotes] = useState("Reefer temp maintained at 4.0°C. Standard palletized crating.");

  const lineTotal = quantityKg * lot.unitPricePerKg;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (quantityKg <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    if (quantityKg > lot.availableQuantityKg) {
      setError(
        `Requested ${quantityKg} kg exceeds currently available stock (${lot.availableQuantityKg} kg). Overselling is prevented.`
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          harvestLotId: lot.id,
          quantityKg: Number(quantityKg),
          deliveryAddress,
          expectedDeliveryDate: new Date(deliveryDate).toISOString(),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Order placement failed");
      }

      setSuccessOrder(data.order.orderNumber);
      setTimeout(() => {
        setIsOpen(false);
        router.push("/orders");
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Order creation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex-1 py-2 px-3 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold text-center transition-colors flex items-center justify-center gap-1.5 shadow-xs"
      >
        <ShoppingCart className="w-3.5 h-3.5" />
        <span>Purchase Lot</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                  B2B Procurement Desk
                </span>
                <h3 className="font-bold text-sm tracking-tight text-white mt-0.5">
                  Reserve Produce &bull; {lot.cropName} ({lot.grade})
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePurchase} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {successOrder && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg flex items-center gap-2 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>
                    Order {successOrder} confirmed! Stock reserved atomically. Redirecting...
                  </span>
                </div>
              )}

              {/* Lot Overview Pill */}
              <div className="p-3 bg-[#F8F9F6] rounded-xl border border-[#E2E8E0] space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lot Code:</span>
                  <span className="font-mono font-bold text-emerald-900">{lot.lotCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Origin Farm:</span>
                  <span className="font-medium text-[#0F1D2F]">{lot.farmName} ({lot.location})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Available Stock:</span>
                  <span className="font-bold text-[#0F1D2F]">{lot.availableQuantityKg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unit Price:</span>
                  <span className="font-bold text-emerald-800">{formatINR(lot.unitPricePerKg)} / kg</span>
                </div>
              </div>

              {/* Quantity Input */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-700">Order Quantity (kg)</label>
                  <span className="text-slate-400 text-[11px]">Max: {lot.availableQuantityKg} kg</span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={lot.availableQuantityKg}
                  step="0.5"
                  value={quantityKg}
                  onChange={(e) => setQuantityKg(parseFloat(e.target.value) || 0)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] font-bold text-sm outline-none focus:ring-2 focus:ring-[#1B532D]/30"
                  required
                />
              </div>

              {/* Financial Summary */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-800 block">
                    Calculated Total Value
                  </span>
                  <span className="text-lg font-bold text-emerald-900">
                    {formatINR(lineTotal)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-emerald-800">
                  <span className="font-mono font-medium">
                    {quantityKg} kg &times; ₹{lot.unitPricePerKg}
                  </span>
                </div>
              </div>

              {/* Delivery Address */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Delivery Destination / Cold Hub
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs"
                  required
                />
              </div>

              {/* Expected Delivery Date */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Requested Delivery Date
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs"
                  required
                />
              </div>

              {/* Special Handling / Crating Notes */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Special Handling / Crating Instructions
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs focus:ring-2 focus:ring-[#1B532D]/30"
                  placeholder="e.g. Cold-chain palletization, temperature requirements"
                />
              </div>

              {/* Invariant guarantee callout */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  Transactional inventory reservation guarantees this quantity cannot be double-sold.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || quantityKg <= 0 || quantityKg > lot.availableQuantityKg}
                  className="px-5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Order &bull; Reserve Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
