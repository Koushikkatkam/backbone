import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/session";
import { Role } from "@prisma/client";
import { createCropAdvisory } from "@/server/services/advisoryService";
import { z } from "zod";

const GenerateAdvisorySchema = z.object({
  cropCycleId: z.string().min(1),
  category: z.string().optional(),
  severity: z.string().optional(),
  customContent: z.string().optional(),
  customActions: z.array(z.string()).optional(),
});

export async function GET() {
  try {
    const advisories = await prisma.agronomyAdvisory.findMany({
      include: {
        cropCycle: {
          include: {
            cropCatalogue: true,
            farmUnit: {
              include: { farmerProfile: { include: { user: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: advisories.length, advisories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch advisories";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    requireRole(user, [Role.ADMIN, Role.AGRONOMIST, Role.FRANCHISE_OPERATOR]);

    const body = await req.json();
    const data = GenerateAdvisorySchema.parse(body);

    const advisory = await createCropAdvisory({
      cropCycleId: data.cropCycleId,
      category: data.category,
      severity: data.severity,
      customContent: data.customContent,
      customActions: data.customActions,
      operatorUserId: user?.id,
    });

    return NextResponse.json({
      success: true,
      message: `Agronomy advisory ${advisory.advisoryCode} generated and dispatched to farmer.`,
      advisory,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to generate advisory";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}
