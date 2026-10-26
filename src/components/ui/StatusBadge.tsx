import React from "react";
import { Badge } from "./Badge";
import { CheckCircle2, AlertCircle, Clock, Truck, ShieldCheck, Activity } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  source?: string;
  className?: string;
}

export function StatusBadge({ status, source, className }: StatusBadgeProps) {
  const normalized = status.toUpperCase();

  // Tier mappings
  if (normalized === "VERTICAL_HYDROPONIC_A_FRAME") {
    return (
      <Badge variant="tier" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        Tier 1: Vertical A-Frame
      </Badge>
    );
  }
  if (normalized === "SEMI_CLOSED_POLY_CANOPY") {
    return (
      <Badge variant="tier" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
        Tier 2: Poly-Canopy
      </Badge>
    );
  }
  if (normalized === "FARMGATE_PROCESSING_SILO") {
    return (
      <Badge variant="tier" className={className}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
        Tier 3: Silo & Solar Drying
      </Badge>
    );
  }

  // Quality grades
  if (normalized === "GRADE_A") {
    return (
      <Badge variant="success" className={className}>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
        Grade-A Premium
      </Badge>
    );
  }
  if (normalized === "GRADE_B") {
    return (
      <Badge variant="warning" className={className}>
        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
        Grade-B Standard
      </Badge>
    );
  }

  // Settlements & Payments
  if (normalized === "SETTLED" || normalized === "PAID") {
    return (
      <Badge variant="success" className={className}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Settled (24h)
      </Badge>
    );
  }
  if (normalized === "PENDING" || normalized === "DRAFT") {
    return (
      <Badge variant="warning" className={className}>
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        Pending Payout
      </Badge>
    );
  }

  // Logistics & Shipments
  if (normalized === "IN_TRANSIT") {
    return (
      <Badge variant="info" className={className}>
        <Truck className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
        In Cold Transit
      </Badge>
    );
  }
  if (normalized === "DELIVERED") {
    return (
      <Badge variant="success" className={className}>
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        Delivered
      </Badge>
    );
  }

  // Sensors
  if (normalized === "ONLINE" || normalized === "HEALTHY" || normalized === "OPERATIONAL") {
    return (
      <Badge variant="success" className={className}>
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
        <Activity className="w-3.5 h-3.5 text-emerald-600" />
        {status}
      </Badge>
    );
  }

  // Alerts
  if (normalized === "WARNING" || normalized === "ATTENTION_REQUIRED") {
    return (
      <Badge variant="warning" className={className}>
        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
        {status}
      </Badge>
    );
  }
  if (normalized === "CRITICAL" || normalized === "REJECTED" || normalized === "OFFLINE") {
    return (
      <Badge variant="danger" className={className}>
        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
        {status}
      </Badge>
    );
  }

  // Default fallback
  return (
    <Badge variant="neutral" className={className}>
      {status}
      {source && <span className="opacity-70 text-[10px]">({source})</span>}
    </Badge>
  );
}
