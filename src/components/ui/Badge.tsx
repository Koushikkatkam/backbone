import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "danger" | "info" | "neutral" | "simulated" | "tier";
  size?: "sm" | "md";
}

export function Badge({
  children,
  className,
  variant = "neutral",
  size = "md",
  ...props
}: BadgeProps) {
  const variantStyles = {
    success: "bg-emerald-50 text-emerald-800 border-emerald-300 ring-emerald-500/20",
    warning: "bg-amber-50 text-amber-800 border-amber-300 ring-amber-500/20",
    danger: "bg-rose-50 text-rose-800 border-rose-300 ring-rose-500/20",
    info: "bg-sky-50 text-sky-800 border-sky-300 ring-sky-500/20",
    neutral: "bg-slate-100 text-slate-700 border-slate-300 ring-slate-500/20",
    simulated: "bg-purple-50 text-purple-700 border-purple-300 font-mono text-[11px]",
    tier: "bg-[#0F1D2F] text-emerald-300 border-emerald-600/40 font-medium",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border transition-colors",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
