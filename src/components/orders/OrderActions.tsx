"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Truck, Ban, Loader2, X, AlertCircle } from "lucide-react";

interface OrderActionsProps {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    hasShipment: boolean;
    deliveryAddress: string;
  };
}

export function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();

  // Cancel Modal State
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Schedule Pickup Modal State
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState("TS-03-EB-4192");
  const [vehicleType, setVehicleType] = useState("Refrigerated Mini-Van 1.5T");
  const [pickupLocation, setPickupLocation] = useState("Mulugu Aggregation Cold Hub");
  const [destination, setDestination] = useState(order.deliveryAddress);
  const [pickupTime, setPickupTime] = useState(() => {
    const d = new Date(Date.now() + 6 * 3600 * 1000);
    return d.toISOString().slice(0, 16);
  });
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason || cancelReason.trim().length < 3) {
      setCancelError("Please enter a valid cancellation reason.");
      return;
    }

    setCancelLoading(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/v1/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL",
          reason: cancelReason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to cancel order");
      }

      setIsCancelOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setCancelError(err instanceof Error ? err.message : "Cancellation failed");
    } finally {
      setCancelLoading(false);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleLoading(true);
    setScheduleError(null);

    try {
      const res = await fetch("/api/v1/logistics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          vehicleNumber,
          vehicleType,
          pickupLocation,
          destination,
          scheduledPickupTime: new Date(pickupTime).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to schedule pickup");
      }

      setIsScheduleOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setScheduleError(err instanceof Error ? err.message : "Scheduling failed");
    } finally {
      setScheduleLoading(false);
    }
  };

  const canCancel = order.status === "RESERVED" || order.status === "CONFIRMED";
  const canSchedule = (order.status === "RESERVED" || order.status === "CONFIRMED") && !order.hasShipment;

  if (!canCancel && !canSchedule) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5">
      {canSchedule && (
        <button
          onClick={() => setIsScheduleOpen(true)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-[11px] font-semibold transition-colors"
          title="Schedule Cold Transit Pickup"
        >
          <Truck className="w-3 h-3 text-sky-600" />
          <span>Schedule</span>
        </button>
      )}

      {canCancel && (
        <button
          onClick={() => setIsCancelOpen(true)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-semibold transition-colors"
          title="Cancel order and release inventory hold"
        >
          <Ban className="w-3 h-3 text-rose-500" />
          <span>Cancel</span>
        </button>
      )}

      {/* Cancel Modal */}
      {isCancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Cancel Order {order.orderNumber}</h3>
                <p className="text-[11px] text-rose-200">
                  Atomically releases stock reservation back to marketable inventory.
                </p>
              </div>
              <button
                onClick={() => setIsCancelOpen(false)}
                className="text-rose-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="p-6 space-y-4 text-xs">
              {cancelError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{cancelError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Cancellation Reason &bull; Required for Audit Log
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Buyer delivery rescheduled; releasing produce for immediate spot sale."
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-xs"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCancelOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {cancelLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Cancellation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {isScheduleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-[#0F1D2F] text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">Schedule Cold-Chain Transit</h3>
                <p className="text-[11px] text-slate-300">
                  Assigns reefer vehicle and driver for Order {order.orderNumber}.
                </p>
              </div>
              <button
                onClick={() => setIsScheduleOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4 text-xs">
              {scheduleError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{scheduleError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Number</label>
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Specification</label>
                <input
                  type="text"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Pickup Hub</label>
                  <input
                    type="text"
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Departure Time</label>
                  <input
                    type="datetime-local"
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none text-[11px]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destination</label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full p-2 border border-slate-200 rounded-lg text-[#0F1D2F] outline-none"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleLoading}
                  className="px-4 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white font-semibold flex items-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  {scheduleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Schedule Reefer Pickup</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
