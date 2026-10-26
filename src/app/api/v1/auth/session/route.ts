/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, setSessionUser, clearSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { DEMO_USERS } from "@/lib/constants";
import { Role } from "@prisma/client";
import { z } from "zod";

const SwitchUserSchema = z.object({
  userId: z.string().optional(),
  role: z.string().optional(),
});

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({
      success: true,
      user,
      availableDemoUsers: DEMO_USERS,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to retrieve session";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = SwitchUserSchema.parse(body);

    let targetUser: any = null;

    // 1. Try DB lookup first
    try {
      if (parsed.userId) {
        targetUser = await prisma.user.findUnique({
          where: { id: parsed.userId },
          include: { farmerProfile: true, buyerProfile: true },
        });
      } else if (parsed.role) {
        targetUser = await prisma.user.findFirst({
          where: { role: parsed.role as Role },
          include: { farmerProfile: true, buyerProfile: true },
        });
      }
    } catch (dbErr) {
      console.warn("Database lookup failed during session switch, using demo fallback:", dbErr);
    }

    // 2. Resilient Fallback: If DB query fails or user record is not yet seeded on Vercel
    if (!targetUser) {
      const demoUser = DEMO_USERS.find(
        (u) => u.id === parsed.userId || (parsed.role && u.role === parsed.role)
      );
      if (demoUser) {
        targetUser = {
          id: demoUser.id,
          email: demoUser.email,
          name: demoUser.name,
          role: demoUser.role,
          avatarUrl: null,
          phone: "+91 98490 12345",
          isActive: true,
          status: "ACTIVE",
          isDemo: true,
          farmerProfile: demoUser.role === Role.FARMER ? { id: "prof-farmer-01", userId: demoUser.id, farmUnitId: "farm-unit-01" } : null,
          buyerProfile: demoUser.role === Role.BUYER ? { id: "bp-01", userId: demoUser.id } : null,
        };
      }
    }

    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: "Requested demo user not found." },
        { status: 404 }
      );
    }

    await setSessionUser(targetUser.id);

    return NextResponse.json({
      success: true,
      message: `Switched demo identity to ${targetUser.name} (${targetUser.role})`,
      user: targetUser,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to switch user";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE() {
  try {
    await clearSession();
    return NextResponse.json({ success: true, message: "Demo session cleared." });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to clear session";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
