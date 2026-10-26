import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const role = user?.role || Role.FARMER;

    // Search FarmUnits
    const farmUnits = await prisma.farmUnit.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { farmCode: { contains: query } },
          { locationAddress: { contains: query } },
        ],
        ...(role === Role.FARMER && user
          ? { farmerProfile: { userId: user.id } }
          : role === Role.FRANCHISE_OPERATOR && user
          ? { operatorUserId: user.id }
          : {}),
      },
      include: { farmerProfile: { include: { user: true } } },
      take: 4,
    });

    // Search HarvestLots
    const lots = await prisma.harvestLot.findMany({
      where: {
        OR: [
          { lotCode: { contains: query } },
          { grade: { contains: query } },
          { storageFacility: { contains: query } },
        ],
      },
      include: {
        harvestRecord: {
          include: {
            cropCycle: { include: { cropCatalogue: true } },
            farmUnit: true,
          },
        },
      },
      take: 4,
    });

    // Search Orders (Admins, Buyers, Logistics)
    const orders =
      role !== Role.FARMER
        ? await prisma.order.findMany({
            where: {
              OR: [
                { orderNumber: { contains: query } },
                { deliveryAddress: { contains: query } },
              ],
              ...(role === Role.BUYER && user
                ? { buyerProfile: { userId: user.id } }
                : {}),
            },
            include: { buyerProfile: true },
            take: 4,
          })
        : [];

    // Search Crop Catalogues
    const crops = await prisma.cropCatalogue.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { variety: { contains: query } },
          { cropCode: { contains: query } },
        ],
      },
      take: 3,
    });

    const results = [
      ...farmUnits.map((f) => ({
        type: "FARM",
        title: f.name,
        subtitle: `${f.farmCode} • ${f.farmerProfile.user.name} (${f.tier})`,
        href: `/farms/${f.id}`,
      })),
      ...lots.map((l) => ({
        type: "HARVEST_LOT",
        title: l.lotCode,
        subtitle: `${l.harvestRecord.cropCycle.cropCatalogue.name} (${l.grade}) • ${l.availableQuantityKg} kg available`,
        href: `/harvests/${l.lotCode}`,
      })),
      ...orders.map((o) => ({
        type: "ORDER",
        title: o.orderNumber,
        subtitle: `${o.buyerProfile.companyName} • ₹${o.totalAmount.toLocaleString()} (${o.status})`,
        href: `/orders`,
      })),
      ...crops.map((c) => ({
        type: "CROP",
        title: c.name,
        subtitle: `${c.variety} • Target Yield: ${c.targetYieldKgPerAcre} kg/acre`,
        href: `/crops`,
      })),
    ];

    return NextResponse.json({ success: true, count: results.length, results });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Search failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
