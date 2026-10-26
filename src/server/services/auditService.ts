import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export interface LogAuditOptions {
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  ipAddress?: string;
}

export async function logAuditEvent(
  options: LogAuditOptions,
  client: Prisma.TransactionClient | typeof prisma = prisma
) {
  try {
    return await client.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        previousState: options.previousState,
        newState: options.newState,
        reason: options.reason,
        ipAddress: options.ipAddress ?? "127.0.0.1",
      },
    });
  } catch (error) {
    console.error("Failed to write audit event:", error);
    return null;
  }
}
