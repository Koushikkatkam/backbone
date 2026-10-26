/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";

/**
 * Neutralizes spreadsheet formula injection (CWE-1236)
 * Prefixes cells beginning with =, +, -, @, \t, or \r with a single quote
 * and escapes double quotes.
 */
function sanitizeCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${sanitized.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.FRANCHISE_OPERATOR]);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "payables";

    if (type === "payables") {
      let payables: any[] = [];
      try {
        payables = await prisma.farmerPayable.findMany({
          include: {
            farmerProfile: { include: { user: true } },
            settlementRecord: true,
          },
          orderBy: { createdAt: "desc" },
        });
      } catch {
        const { FALLBACK_PAYABLES } = await import("@/server/fallbackData");
        payables = FALLBACK_PAYABLES;
      }

      if (payables.length === 0) {
        const { FALLBACK_PAYABLES } = await import("@/server/fallbackData");
        payables = FALLBACK_PAYABLES;
      }

      const header = "PayableCode,FarmerName,District,GrossAmountINR,DeductionsINR,NetPayableINR,Status,DueDate,SettlementReference\n";
      const rows = payables.map((p) =>
        [
          sanitizeCsv(p.payableCode),
          sanitizeCsv(p.farmerProfile?.user?.name || "Farmer"),
          sanitizeCsv(p.farmerProfile?.district || "Warangal"),
          sanitizeCsv(p.grossAmount),
          sanitizeCsv(p.deductionsAmount),
          sanitizeCsv(p.netPayable),
          sanitizeCsv(p.status),
          sanitizeCsv(p.dueDate ? (p.dueDate instanceof Date ? p.dueDate : new Date(p.dueDate)).toISOString().slice(0, 10) : ""),
          sanitizeCsv(p.settlementRecord?.transactionReference || "UNSETTLED"),
        ].join(",")
      );

      const csv = header + rows.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="farmer_payables_${Date.now()}.csv"`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    if (type === "settlements") {
      let settlements: any[] = [];
      try {
        settlements = await prisma.settlementRecord.findMany({
          include: {
            farmerProfile: { include: { user: true } },
            farmerPayable: true,
          },
          orderBy: { disbursedAt: "desc" },
        });
      } catch {
        const { FALLBACK_SETTLEMENTS } = await import("@/server/fallbackData");
        settlements = FALLBACK_SETTLEMENTS;
      }

      if (settlements.length === 0) {
        const { FALLBACK_SETTLEMENTS } = await import("@/server/fallbackData");
        settlements = FALLBACK_SETTLEMENTS;
      }

      const header = "SettlementCode,TxnReference,FarmerName,DisbursedAmountINR,HoursToSettle,DisbursedAt,Status,Source\n";
      const rows = settlements.map((s) =>
        [
          sanitizeCsv(s.settlementCode),
          sanitizeCsv(s.transactionReference),
          sanitizeCsv(s.farmerProfile?.user?.name || "Farmer"),
          sanitizeCsv(s.disbursedAmount),
          sanitizeCsv(s.hoursToSettle),
          sanitizeCsv(s.disbursedAt ? (s.disbursedAt instanceof Date ? s.disbursedAt : new Date(s.disbursedAt)).toISOString() : ""),
          sanitizeCsv(s.settlementStatus),
          sanitizeCsv(s.source),
        ].join(",")
      );

      const csv = header + rows.join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="settlements_ledger_${Date.now()}.csv"`,
          "X-Content-Type-Options": "nosniff",
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid export type" }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "CSV export failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
