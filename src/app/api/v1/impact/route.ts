import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const targets = await prisma.impactMetricTarget.findMany({
      orderBy: { baselineValue: "asc" },
    });

    return NextResponse.json({
      success: true,
      note: "CRITICAL PROTOTYPE INVARIANT: All figures are projected targets for the pilot, NOT validated outcomes.",
      targets,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch impact targets";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
