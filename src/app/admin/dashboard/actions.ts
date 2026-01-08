"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

export async function markOrderAsPaid(orderId: string) {
    try {
        await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.purchaseOrder.update({
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

            // Handle Stock Reduction for Event Items
            if (updatedOrder.eventId) {
                for (const item of updatedOrder.items) {
                    const eventId = updatedOrder.eventId;

                    try {
                        switch (item.productType) {
                            case "TICKET":
                                await tx.eventTicket.update({
                                    where: { eventId_ticketId: { eventId, ticketId: item.productId } },
                                    data: { quantity: { decrement: item.quantity } }
                                });
                                break;
                            case "SPONSOR":
                                await tx.eventSponsorType.update({
                                    where: { eventId_sponsorTypeId: { eventId, sponsorTypeId: item.productId } },
                                    data: { quantity: { decrement: item.quantity } }
                                });
                                break;
                            case "HOTEL":
                                if (item.roomTypeId) {
                                    await tx.eventRoomType.update({
                                        where: { eventId_roomTypeId: { eventId, roomTypeId: item.roomTypeId } },
                                        data: { quantity: { decrement: item.quantity } }
                                    });
                                }
                                break;
                            case "BOOTH":
                                await tx.eventBooth.update({
                                    where: { eventId_boothId: { eventId, boothId: item.productId } },
                                    data: { quantity: { decrement: Math.max(1, item.quantity) } }
                                });
                                break;
                        }
                    } catch (e) {
                        console.error(`Failed to reduce stock for item ${item.name} (ID: ${item.productId}):`, e);
                        // We continue even if stock reduction fails (e.g. record missing), 
                        // or we could throw to rollback. Given "Admin Approves", forcing success is usually preferred 
                        // unless we want strict inventory control. 
                        // For now, logging error but allowing completion seems checks balanced.
                        // Actually, strict inventory would be better but let's not block payment approval if data is slightly sync-off.
                    }
                }
            }

            // Check if this order contains a membership purchase
            const membershipItem = updatedOrder.items.find(item => item.productType === "MEMBERSHIP");

            if (membershipItem && membershipItem.productId) {
                // Activate membership for the company
                const plan = await tx.membershipPlan.findUnique({
                    where: { id: membershipItem.productId }
                });

                if (plan) {
                    const now = new Date();
                    const isLifetime = plan.name.toLowerCase().includes("diamond");
                    let expires: Date | null = null;

                    if (!isLifetime) {
                        const currentExpiry = updatedOrder.company.membershipExpiresAt;
                        const baseStart = (currentExpiry && currentExpiry > now) ? currentExpiry : now;
                        expires = new Date(baseStart.getTime() + 365 * 24 * 60 * 60 * 1000);
                    }

                    await tx.company.update({
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
        });

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark order as paid:", error);
        return { success: false, error: "Failed to update order" };
    }
}
