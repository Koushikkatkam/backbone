/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { Role, User, FarmerProfile, BuyerProfile } from "@prisma/client";

const SESSION_COOKIE_NAME = "pb_demo_session";

export type SessionUser = User & {
  farmerProfile?: FarmerProfile | null;
  buyerProfile?: BuyerProfile | null;
};

/**
 * Retrieves the currently active authenticated demo user from the server-side cookie.
 * Defaults to the Admin user for presentation convenience if not set.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    const userId = sessionCookie?.value;

    if (userId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            farmerProfile: true,
            buyerProfile: true,
          },
        });
        if (user) return user;
      } catch (dbErr) {
        console.warn("Database unavailable in getCurrentUser, checking static demo registry:", dbErr);
      }

      // Fallback: If DB query fails or user record is missing in DB on Vercel
      const { DEMO_USERS } = await import("@/lib/constants");
      const matchedDemo = DEMO_USERS.find((u) => u.id === userId);
      if (matchedDemo) {
        return {
          id: matchedDemo.id,
          email: matchedDemo.email,
          name: matchedDemo.name,
          role: matchedDemo.role,
          avatarUrl: null,
          phone: "+91 98490 12345",
          isActive: true,
          isDemo: true,
          status: "ACTIVE",
          createdAt: new Date(),
          updatedAt: new Date(),
          farmerProfile: matchedDemo.role === Role.FARMER ? ({ id: "prof-farmer-01", userId: matchedDemo.id, farmUnitId: "farm-unit-01" } as any) : null,
          buyerProfile: matchedDemo.role === Role.BUYER ? ({ id: "prof-buyer-01", userId: matchedDemo.id } as any) : null,
        } as SessionUser;
      }
    }

    // When no session cookie exists:
    // If strict production isolation is enforced via ALLOW_DEMO_DEFAULT_AUTH=false, return null
    if (process.env.ALLOW_DEMO_DEFAULT_AUTH === "false") {
      return null;
    }

    // Otherwise, default to Admin demo persona so the presentation is immediately interactive
    try {
      const defaultAdmin = await prisma.user.findFirst({
        where: { role: Role.ADMIN },
        include: { farmerProfile: true, buyerProfile: true },
      });
      if (defaultAdmin) return defaultAdmin;
    } catch {
      // Fallback to static Admin
    }

    const { DEMO_USERS } = await import("@/lib/constants");
    const adminDemo = DEMO_USERS.find((u) => u.role === Role.ADMIN) || DEMO_USERS[0];
    return {
      id: adminDemo.id,
      email: adminDemo.email,
      name: adminDemo.name,
      role: adminDemo.role,
      avatarUrl: null,
      phone: "+91 98490 12345",
      isActive: true,
      isDemo: true,
      status: "ACTIVE",
      createdAt: new Date(),
      updatedAt: new Date(),
      farmerProfile: null,
      buyerProfile: null,
    } as SessionUser;
  } catch (err: unknown) {
    // Rethrow Next.js dynamic server bailouts so Next.js handles them cleanly
    const errorDigest = (err as { digest?: string })?.digest;
    if (errorDigest?.includes("DYNAMIC") || errorDigest?.includes("HANGING")) {
      throw err;
    }
    return null;
  }
}

/**
 * Sets the demo session cookie to switch the active role/user.
 */
export async function setSessionUser(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Server-side authorization verification.
 * Throws an Error if user is null or does not have one of the required roles.
 */
export function requireRole(user: SessionUser | null, allowedRoles: Role[]): void {
  if (!user) {
    throw new Error("UNAUTHENTICATED: Active demo identity is required.");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new Error(
      `UNAUTHORIZED: Role ${user.role} does not have permission to execute this operation. Required: [${allowedRoles.join(", ")}]`
    );
  }
}
