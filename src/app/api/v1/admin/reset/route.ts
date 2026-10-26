import { NextResponse } from "next/server";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST() {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN]);

    // Safety guard: Demo reset must never run in unintended production environments
    if (process.env.NODE_ENV === "production" && process.env.ENABLE_DEMO_RESET !== "true") {
      return NextResponse.json(
        {
          success: false,
          error: "CRITICAL SAFETY GUARD: Demo database reset is strictly prohibited in production environments.",
        },
        { status: 403 }
      );
    }

    // Re-run seed script
    await execAsync("npx tsx prisma/seed.ts");

    return NextResponse.json({
      success: true,
      message: "Database successfully reset to standard Telangana pilot seed data.",
      resetAt: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Reset failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
