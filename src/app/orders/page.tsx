import React from "react";
import { AppShell } from "@/components/layout/AppShell";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatINR } from "@/lib/utils";
import Link from "next/link";
import { Truck, ArrowRight } from "lucide-react";
import { OrderActions } from "@/components/orders/OrderActions";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    include: {
      buyerProfile: true,
      orderLines: {
        include: {
          harvestLot: {
            include: {
              harvestRecord: {
                include: {
                  cropCycle: { include: { cropCatalogue: true } },
                  farmUnit: true,
                },
              },
            },
          },
        },
      },
      shipments: true,
      invoice: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppShell>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F1D2F]">
            Orders &amp; Procurement Contracts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            B2B bulk orders, inventory reservations, cold-chain fulfillment, and invoicing.
          </p>
        </div>
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1B532D] hover:bg-[#133E21] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <span>Explore Marketplace</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>B2B Order Registry</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time stock reservation and fulfillment dispatch status
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8F9F6] border-b border-[#E2E8E0] text-slate-500 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3">Order Number</th>
                    <th className="px-4 py-3">Buyer Enterprise</th>
                    <th className="px-4 py-3">Items &amp; Lot</th>
                    <th className="px-4 py-3">Quantity</th>
                    <th className="px-4 py-3">Total Value</th>
                    <th className="px-4 py-3">Fulfillment</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8E0]">
                  {orders.map((order) => {
                    const line = order.orderLines[0];
                    const shipment = order.shipments[0];

                    return (
                      <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-800">
                          {order.orderNumber}
                          <p className="text-[11px] text-slate-400 font-sans font-normal">
                            {order.createdAt.toISOString().slice(0, 10)}
                          </p>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-[#0F1D2F]">{order.buyerProfile.companyName}</p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{order.deliveryAddress}</p>
                        </td>
                        <td className="px-4 py-3.5">
                          {line ? (
                            <div>
                              <p className="font-medium text-[#0F1D2F]">
                                {line.harvestLot.harvestRecord.cropCycle.cropCatalogue.name}
                              </p>
                              <Link
                                href={`/harvests/${line.harvestLot.lotCode}`}
                                className="font-mono text-[11px] text-emerald-800 hover:underline"
                              >
                                {line.harvestLot.lotCode}
                              </Link>
                            </div>
                          ) : (
                            <span className="text-slate-400">Multiple items</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#0F1D2F]">
                          {line?.quantityKg} kg
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-800 text-sm">
                          {formatINR(order.totalAmount)}
                        </td>
                        <td className="px-4 py-3.5">
                          {shipment ? (
                            <div className="flex items-center gap-1.5 text-sky-800 font-medium">
                              <Truck className="w-3.5 h-3.5 text-sky-600" />
                              <span className="font-mono text-[11px]">{shipment.vehicleNumber}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400">Pending dispatch</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={order.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <OrderActions
                            order={{
                              id: order.id,
                              orderNumber: order.orderNumber,
                              status: order.status,
                              hasShipment: Boolean(shipment),
                              deliveryAddress: order.deliveryAddress,
                            }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
