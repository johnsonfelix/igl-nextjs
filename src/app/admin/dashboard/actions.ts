"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markOrderAsPaid(orderId: string) {
    try {
        const updatedOrder = await prisma.purchaseOrder.update({
            where: { id: orderId },
            data: {
                status: "COMPLETED",
                offlinePayment: true,
            },
            include: {
                items: true,
                company: true,
            }
        });

        // Check if this order contains a membership purchase
        const membershipItem = updatedOrder.items.find(item => item.productType === "MEMBERSHIP");

        if (membershipItem && membershipItem.productId) {
            // Activate membership for the company
            const plan = await prisma.membershipPlan.findUnique({
                where: { id: membershipItem.productId }
            });

            if (plan) {
                const now = new Date();
                // Determine expiry: Logic mirrored from client/route (Diamond = Lifetime/null, others 365 days)
                // If we want to be safe, valid assumptions:
                const isLifetime = plan.name.toLowerCase().includes("diamond");
                let expires: Date | null = null;

                if (!isLifetime) {
                    // Default 365 days
                    expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

                    // If company already has future expiry, extend it? 
                    // Simple logic: if existing expiry > now, add 365 to THAT. 
                    // keeping it simple as per original route: 
                    // Original route logic:
                    // const baseStart = company.membershipExpiresAt > now ? company.membershipExpiresAt : now;
                    // expires = baseStart + duration

                    const currentExpiry = updatedOrder.company.membershipExpiresAt;
                    const baseStart = (currentExpiry && currentExpiry > now) ? currentExpiry : now;
                    expires = new Date(baseStart.getTime() + 365 * 24 * 60 * 60 * 1000);
                }

                await prisma.company.update({
                    where: { id: updatedOrder.companyId },
                    data: {
                        membershipPlan: { connect: { id: plan.id } },
                        purchasedMembership: plan.name,
                        purchasedAt: now,
                        membershipExpiresAt: expires,
                        memberType: "PAID",
                        memberSince: updatedOrder.company.memberSince ?? now,
                    }
                });
            }
        }
        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark order as paid:", error);
        return { success: false, error: "Failed to update order" };
    }
}
