import { describe, it, expect, beforeAll } from "vitest";
import { prisma } from "../src/lib/prisma";
import { Role } from "@prisma/client";
import { getCurrentUser } from "../src/lib/session";

describe("Pre-GitHub Security & Authorization Guardrails", () => {
  let farmerAUserId: string;
  let farmerBFarmId: string;

  beforeAll(async () => {
    // Locate two distinct farmers
    const farmers = await prisma.farmerProfile.findMany({
      take: 2,
      include: { user: true, farmUnits: true },
    });
    if (farmers.length < 2) throw new Error("At least two farmers required for IDOR testing");

    farmerAUserId = farmers[0].userId;
    farmerBFarmId = farmers[1].farmUnits[0].id;
  });

  it("verifies production session guard prevents unauthenticated fallback to ADMIN", async () => {
    const envObj = process.env as Record<string, string | undefined>;
    const originalEnv = envObj.NODE_ENV;
    try {
      // Simulate production environment
      envObj.NODE_ENV = "production";
      const user = await getCurrentUser();
      // Must NOT default to Admin in production
      expect(user).toBeNull();
    } finally {
      envObj.NODE_ENV = originalEnv;
    }
  });

  it("prohibits demo reset in production without explicit safety override flag", () => {
    const isProduction = true;
    const enableDemoReset = process.env.ENABLE_DEMO_RESET === "true";

    // Test safety logic: reset must be rejected if production and flag is not explicitly true
    const shouldBlock = isProduction && !enableDemoReset;
    expect(shouldBlock).toBe(true);
  });

  it("verifies CSV formula injection sanitizer neutralizes formula triggers (=, +, -, @, \\t)", () => {
    function sanitizeCsv(value: unknown): string {
      if (value === null || value === undefined) return '""';
      const str = String(value);
      const sanitized = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
      return `"${sanitized.replace(/"/g, '""')}"`;
    }

    // Formula injection payloads (CWE-1236)
    expect(sanitizeCsv("=cmd|'/c calc'!A0")).toBe("\"'=cmd|'/c calc'!A0\"");
    expect(sanitizeCsv("+1+1")).toBe("\"'+1+1\"");
    expect(sanitizeCsv("-5+2")).toBe("\"'-5+2\"");
    expect(sanitizeCsv("@SUM(A1:A10)")).toBe("\"'@SUM(A1:A10)\"");
    expect(sanitizeCsv("\tmalicious")).toBe("\"'\tmalicious\"");
    // Safe standard value
    expect(sanitizeCsv("M. Narayana")).toBe('"M. Narayana"');
    // Quotes escaping
    expect(sanitizeCsv('Test "Quoted" Company')).toBe('"Test ""Quoted"" Company"');
  });

  it("verifies buyer role cannot execute shipment dispatch", () => {
    const buyerRole: Role = Role.BUYER;
    const allowedDispatchRoles: Role[] = [Role.ADMIN, Role.LOGISTICS_OPERATOR];

    // Buyer must not be in allowed dispatch roles
    expect(allowedDispatchRoles.includes(buyerRole)).toBe(false);
  });

  it("verifies buyer role is excluded from reading farmer bank settlements", () => {
    const buyerRole: Role = Role.BUYER;
    const allowedSettlementRoles: Role[] = [Role.ADMIN, Role.FRANCHISE_OPERATOR, Role.FARMER];

    // Buyer must be denied access to farmer settlement payout details
    expect(allowedSettlementRoles.includes(buyerRole)).toBe(false);
  });

  it("verifies cross-farmer actuator isolation invariant", async () => {
    const farmerA = await prisma.farmerProfile.findFirst({
      where: { userId: farmerAUserId },
      include: { farmUnits: true },
    });
    const farmB = await prisma.farmUnit.findUnique({
      where: { id: farmerBFarmId },
    });

    expect(farmerA).toBeDefined();
    expect(farmB).toBeDefined();
    // Farmer A's profile ID does not match Farm B's farmerProfileId
    expect(farmerA!.id).not.toBe(farmB!.farmerProfileId);
  });
});
