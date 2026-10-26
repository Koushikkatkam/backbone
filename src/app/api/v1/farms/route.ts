import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Role, InfrastructureTier, Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get("tier");
    const district = searchParams.get("district");

    const whereClause: Prisma.FarmUnitWhereInput = {};
    if (tier) whereClause.tier = tier as InfrastructureTier;
    if (district) {
      whereClause.farmerProfile = { district };
    }

    if (user && user.role === Role.FARMER && user.farmerProfile) {
      whereClause.farmerProfileId = user.farmerProfile.id;
    }

    const farms = await prisma.farmUnit.findMany({
      where: whereClause,
      include: {
        farmerProfile: {
          include: { user: true },
        },
        installations: true,
        cropCycles: {
          include: { cropCatalogue: true },
        },
        sensorDevices: {
          include: {
            readings: {
              take: 1,
              orderBy: { timestamp: "desc" },
            },
            alerts: {
              where: { isResolved: false },
            },
          },
        },
      },
      orderBy: { farmCode: "asc" },
    });

    return NextResponse.json({
      success: true,
      count: farms.length,
      farms,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch farms";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
