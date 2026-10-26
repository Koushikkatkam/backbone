import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "gold" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const variantStyles = {
      primary:
        "bg-[#1B532D] text-white hover:bg-[#133E21] active:bg-[#0E2C17] border border-[#1B532D] shadow-sm",
      secondary:
        "bg-[#0F1D2F] text-white hover:bg-[#182C44] active:bg-[#08111E] border border-[#0F1D2F] shadow-sm",
      outline:
        "bg-white text-[#0F1D2F] border border-[#CBD5E1] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]",
      ghost:
        "bg-transparent text-[#0F1D2F] hover:bg-[#F1F5F9] active:bg-[#E2E8F0]",
      gold:
        "bg-[#B45309] text-white hover:bg-[#92400E] active:bg-[#78350F] border border-[#B45309] shadow-sm",
      danger:
        "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 border border-rose-600 shadow-sm",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs font-medium rounded-md",
      md: "h-9.5 px-4 text-sm font-medium rounded-lg",
      lg: "h-11 px-5 text-base font-medium rounded-lg",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          "inline-flex items-center justify-center gap-2 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1B532D]/40 disabled:opacity-50 disabled:cursor-not-allowed select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
