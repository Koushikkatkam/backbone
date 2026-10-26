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
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          farmerProfile: true,
          buyerProfile: true,
        },
      });
      if (user) return user;
    }

    // In production, unauthenticated requests must never default to admin
    if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_DEFAULT_AUTH === "false") {
      return null;
    }

    // Default fallback to first admin for local presentation convenience only
    return await prisma.user.findFirst({
      where: { role: Role.ADMIN },
      include: {
        farmerProfile: true,
        buyerProfile: true,
      },
    });
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
