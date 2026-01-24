import { prisma } from "@/app/lib/prisma";
import DashboardClient from "./DashboardClient";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
    // Fetch recent orders with relations
    const ordersRaw = await prisma.purchaseOrder.findMany({
        take: 50,
        orderBy: { createdAt: "desc" },
        include: {
            company: {
                select: {
                    name: true,
                    logoUrl: true,
                    memberId: true,
                    designation: true,
                    location: {
                        select: {
                            email: true,
                            address: true,
                            city: true,
                            country: true,
                            contactPersonDesignation: true
                        }
                    }
                }
            },
            event: {
                select: { name: true }
            },
            items: true,
        },
    });

    // Calculate/Fetch Stats
    const totalRevenueResult = await prisma.purchaseOrder.aggregate({
        _sum: { totalAmount: true },
        where: { status: "COMPLETED" }
    });

    const totalOrdersCount = await prisma.purchaseOrder.count();
    const pendingOrdersCount = await prisma.purchaseOrder.count({ where: { status: "PENDING" } });
    const completedOrdersCount = await prisma.purchaseOrder.count({ where: { status: "COMPLETED" } });

    const totalRevenue = totalRevenueResult._sum.totalAmount || 0;
    const avgOrderValue = completedOrdersCount > 0 ? (totalRevenue / completedOrdersCount) : 0;

    const stats = {
        totalRevenue,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        avgOrderValue
    };

    // Serialize data for Client Component
    const orders = ordersRaw.map(order => ({
        ...order,
        createdAt: order.createdAt.toISOString(),
        company: {
            name: order.company.name,
            email: order.company.location?.email || undefined,
            logoUrl: order.company.logoUrl || undefined,
            memberId: order.company.memberId || undefined,
            designation: order.company.designation || order.company.location?.contactPersonDesignation || undefined,
            address: [order.company.location?.address, order.company.location?.city, order.company.location?.country].filter(Boolean).join(", ") || undefined,
        },
        offlinePayment: order.offlinePayment
    }));

    return <DashboardClient orders={orders} stats={stats} />;
}

