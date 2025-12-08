// /app/api/events/[id]/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface CartItem {
  productId: string;
  productType?: string;
  clientProductType?: string;
  quantity: number;
  price: number;
  name: string;
  roomTypeId?: string;
  boothSubTypeId?: string;
}

function getEventIdFromRequest(req: NextRequest): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 2];
}

export async function POST(req: NextRequest) {
  const eventId = getEventIdFromRequest(req);
  let body: any;

  try {
    body = await req.json();
  } catch (e) {
    console.error("Failed to parse request JSON:", e);
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const {
    cartItems,
    companyId,
    coupon: couponInput,
  }: {
    cartItems: CartItem[];
    companyId: string;
    coupon?: { id?: string; code?: string };
  } = body;

  if (!companyId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Allow eventId to be empty for membership-only purchases
  const finalEventId = eventId && eventId !== 'undefined' ? eventId : null;

  try {
    console.log("--- STARTING CHECKOUT TRANSACTION ---");

    const result = await prisma.$transaction(async (tx) => {
      // Create a PurchaseOrder
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          companyId,
          eventId: finalEventId,
          totalAmount: 0,
          status: "PENDING",
        },
      });
      console.log(`[OK] Created PurchaseOrder ${purchaseOrder.id}`);

      let calculatedTotal = 0;

      for (const originalItem of cartItems) {
        const rawType = (
          originalItem.productType ?? originalItem.clientProductType ?? "PRODUCT"
        )
          .toString()
          .toUpperCase();

        const allowedTypes = ["TICKET", "SPONSOR", "HOTEL", "BOOTH", "MEMBERSHIP", "PRODUCT"];
        const productType = allowedTypes.includes(rawType) ? rawType : "PRODUCT";

        console.log(
          `Processing item: ${originalItem.name} (incoming: ${
            originalItem.productType ?? originalItem.clientProductType
          }, mapped: ${productType})`
        );

        const item = {
          productId: originalItem.productId,
          productType,
          quantity: originalItem.quantity,
          price: originalItem.price,
          name: originalItem.name,
          roomTypeId: originalItem.roomTypeId ?? null,
          boothSubTypeId: originalItem.boothSubTypeId ?? null,
        };

        // Handle inventory & booking logic
        switch (productType) {
          case "TICKET": {
            if (!finalEventId) {
              throw new Error("Event ID is required for ticket purchases.");
            }
            const eventTicket = await tx.eventTicket.findUnique({
              where: { eventId_ticketId: { eventId: finalEventId, ticketId: item.productId } },
            });
            if (!eventTicket || eventTicket.quantity < item.quantity) {
              throw new Error(`Ticket "${item.name}" is sold out or insufficient quantity.`);
            }
            await tx.eventTicket.update({
              where: { eventId_ticketId: { eventId: finalEventId, ticketId: item.productId } },
              data: { quantity: { decrement: item.quantity } },
            });
            console.log(`[OK] Decremented quantity for Ticket: ${item.name}`);
            break;
          }

          case "SPONSOR": {
            if (!finalEventId) {
              throw new Error("Event ID is required for sponsor purchases.");
            }
            const eventSponsor = await tx.eventSponsorType.findUnique({
              where: { eventId_sponsorTypeId: { eventId: finalEventId, sponsorTypeId: item.productId } },
            });
            if (!eventSponsor || eventSponsor.quantity < item.quantity) {
              throw new Error(`Sponsor pack "${item.name}" is sold out or insufficient quantity.`);
            }
            await tx.eventSponsorType.update({
              where: { eventId_sponsorTypeId: { eventId: finalEventId, sponsorTypeId: item.productId } },
              data: { quantity: { decrement: item.quantity } },
            });
            console.log(`[OK] Decremented quantity for Sponsor: ${item.name}`);
            break;
          }

          case "HOTEL": {
            if (!finalEventId) {
              throw new Error("Event ID is required for hotel bookings.");
            }
            if (!item.roomTypeId) throw new Error("Room Type ID is missing for hotel booking.");
            const eventRoomType = await tx.eventRoomType.findUnique({
              where: { eventId_roomTypeId: { eventId: finalEventId, roomTypeId: item.roomTypeId } },
            });

            console.log(
              `Found EventRoomType for room ${item.name}. Current quantity: ${eventRoomType?.quantity}`
            );

            if (!eventRoomType || eventRoomType.quantity < item.quantity) {
              throw new Error(
                `Room type "${item.name}" is sold out or has insufficient quantity.`
              );
            }

            const updatedEventRoomType = await tx.eventRoomType.update({
              where: { eventId_roomTypeId: { eventId: finalEventId, roomTypeId: item.roomTypeId } },
              data: { quantity: { decrement: item.quantity } },
            });

            console.log(
              `[OK] Decremented quantity for Hotel Room: ${item.name}. New quantity: ${updatedEventRoomType.quantity}.`
            );
            break;
          }

          case "BOOTH": {
            if (!finalEventId) {
              throw new Error("Event ID is required for booth purchases.");
            }
            const needed = Math.max(1, item.quantity);

            const eventBooth = await tx.eventBooth.findUnique({
              where: {
                eventId_boothId: {
                  eventId: finalEventId,
                  boothId: item.productId,
                },
              },
            });

            console.log(
              `Found EventBooth for booth ${item.name}. Current quantity: ${eventBooth?.quantity}`
            );

            if (!eventBooth || eventBooth.quantity < needed) {
              throw new Error(
                `Booth "${item.name}" is sold out or has insufficient quantity.`
              );
            }

            const updated = await tx.eventBooth.update({
              where: {
                eventId_boothId: {
                  eventId: finalEventId,
                  boothId: item.productId,
                },
              },
              data: {
                quantity: { decrement: needed },
              },
            });

            console.log(
              `[OK] Decremented quantity for Booth: ${item.name}. New quantity: ${updated.quantity}`
            );
            break;
          }

          case "MEMBERSHIP": {
            // Verify membership plan exists
            const membershipPlan = await tx.membershipPlan.findUnique({
              where: { id: item.productId },
            });

            if (!membershipPlan) {
              throw new Error(`Membership plan "${item.name}" not found.`);
            }

            // Update company with membership details
            const now = new Date();
            const expiresAt = new Date(now);
            expiresAt.setFullYear(expiresAt.getFullYear() + 1); // Default 1 year

            await tx.company.update({
              where: { id: companyId },
              data: {
                membershipPlanId: item.productId,
                purchasedMembership: membershipPlan.name, // Store membership name
                purchasedMembershipId: item.productId,     // Store membership ID
                purchasedAt: now,
                membershipExpiresAt: expiresAt,
              },
            });

            console.log(
              `[OK] Updated company ${companyId} with membership: ${membershipPlan.name} (ID: ${item.productId})`
            );
            break;
          }

          case "PRODUCT":
          default: {
            console.log(
              `[OK] Recording ${productType} item (no inventory changes): ${item.name}`
            );
            break;
          }
        }

        // Create OrderItem for all items
        await tx.orderItem.create({
          data: {
            orderId: purchaseOrder.id,
            productId: item.productId,
            productType: productType,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            roomTypeId: item.roomTypeId ?? undefined,
            boothSubTypeId: item.boothSubTypeId ?? undefined,
          },
        });
        console.log(`[OK] Created OrderItem for: ${item.name}`);

        calculatedTotal += item.price * item.quantity;
      }

      console.log(`[INFO] Calculated subtotal: ${calculatedTotal}`);

      // COUPON VALIDATION & DISCOUNT calculation
      let discountAmount = 0;
      let couponRecord: any = null;

      if (couponInput) {
        if (couponInput.id) {
          couponRecord = await tx.coupon.findUnique({ where: { id: couponInput.id } });
        }
        if (!couponRecord && couponInput.code) {
          couponRecord = await tx.coupon.findFirst({ where: { code: couponInput.code } });
        }

        if (couponRecord) {
          console.log(
            `[INFO] Found coupon ${couponRecord.code} (${couponRecord.discountType} ${couponRecord.discountValue})`
          );
          const dv = Number(couponRecord.discountValue ?? 0);
          if (couponRecord.discountType === "FIXED") {
            discountAmount = Math.min(dv, calculatedTotal);
          } else {
            discountAmount = calculatedTotal * (dv / 100);
          }
          discountAmount = Math.round(discountAmount * 100) / 100;
        } else {
          console.log(
            "[INFO] Coupon provided but not found in DB. Ignoring coupon."
          );
        }
      } else {
        console.log("[INFO] No coupon provided in request body.");
      }

      const finalTotal = Math.max(
        0,
        Math.round((calculatedTotal - discountAmount) * 100) / 100
      );

      const updateData: any = {
        totalAmount: finalTotal,
        status: "COMPLETED",
        discountAmount: discountAmount,
      };

      if (couponRecord) {
        updateData.couponId = couponRecord.id;
      }

      const finalOrder = await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: updateData,
        include: { items: true },
      });

      console.log(
        `[OK] Finalized PurchaseOrder ${finalOrder.id} with total ${finalOrder.totalAmount} (discount ${discountAmount})`
      );

      return finalOrder;
    });

    console.log("--- CHECKOUT TRANSACTION COMPLETED SUCCESSFULLY ---");
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("--- CHECKOUT TRANSACTION FAILED ---");
    console.error("Error during checkout:", error);

    const msg = error?.message ?? String(error);
    const isClientError =
      msg.includes("sold out") ||
      msg.includes("insufficient quantity") ||
      msg.includes("missing") ||
      msg.includes("no longer available") ||
      msg.includes("Not enough available") ||
      msg.includes("not found");

    return NextResponse.json(
      { error: msg || "An unexpected error occurred during checkout." },
      { status: isClientError ? 400 : 500 }
    );
  }
}