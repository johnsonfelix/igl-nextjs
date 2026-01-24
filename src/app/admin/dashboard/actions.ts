"use server";

import { prisma } from "@/app/lib/prisma";
import { revalidatePath } from "next/cache";

import { sendEmail } from "@/lib/email";

export async function markOrderAsPaid(orderId: string) {
    try {
        const result = await prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.purchaseOrder.update({
                where: { id: orderId },
                data: {
                    status: "COMPLETED",
                    offlinePayment: true, // Assuming this flag denotes it was handled offline/manually if not already set, 
                    // though it could be online payment verified manually.
                },
                include: {
                    items: true,
                    company: {
                        include: {
                            location: true, // to get email from location if needed
                            user: true // to get email from user
                        }
                    },
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

            return updatedOrder;
        });

        // Send Email Notification outside transaction
        if (result) {
            const recipientEmail = result.company.location?.email || result.company.user?.email;
            const companyName = result.company.name;
            const accountName = (result.account as any)?.name || result.company.user?.name || "Member";

            if (recipientEmail) {
                const subject = `Payment Approved - Order #${result.id.slice(-6).toUpperCase()}`;
                const html = `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #004aad;">Payment Approved</h2>
                        <p>Dear ${accountName},</p>
                        <p>We are pleased to inform you that your payment for Order <strong>#${result.id.slice(-6).toUpperCase()}</strong> has been successfully approved.</p>
                        
                        <div style="background-color: #f0fff4; border: 1px solid #c6f6d5; padding: 15px; margin: 20px 0; border-radius: 5px;">
                            <strong style="color: #2f855a;">Action Required: Booking Slot Open</strong>
                            <p style="margin-top: 10px;">
                                Prior to the event, slot booking will open. Please log in to your account to book your preferred slots.
                            </p>
                            <p>
                                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #004aad; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Go to Dashboard</a>
                            </p>
                        </div>

                        <p>Thank you for your business.</p>
                        <p>Best regards,<br>Innovative Global Logistics Allianz</p>
                    </div>
                `;

                await sendEmail({ to: recipientEmail, subject, html }).catch(e => console.error("Error sending approval email:", e));
            }
        }

        revalidatePath("/admin/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark order as paid:", error);
        return { success: false, error: "Failed to update order" };
    }
}
