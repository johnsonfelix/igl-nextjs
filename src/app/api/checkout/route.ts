// /app/api/checkout/route.ts
// General checkout endpoint for purchases that don't require an event (e.g., memberships)
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

export async function POST(req: NextRequest) {
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

  try {
    console.log("--- STARTING GENERAL CHECKOUT TRANSACTION ---");

    const result = await prisma.$transaction(async (tx) => {
      // Create a PurchaseOrder WITHOUT eventId (for memberships and other non-event products)
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          companyId,
          eventId: null, // No event required for membership purchases
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

        // Handle different product types
        switch (productType) {
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

          case "TICKET":
          case "SPONSOR":
          case "HOTEL":
          case "BOOTH": {
            // These require an event - should not be in general checkout
            throw new Error(
              `Product type "${productType}" requires an event. Use event-specific checkout endpoint.`
            );
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

    console.log("--- GENERAL CHECKOUT TRANSACTION COMPLETED SUCCESSFULLY ---");
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("--- GENERAL CHECKOUT TRANSACTION FAILED ---");
    console.error("Error during checkout:", error);

    const msg = error?.message ?? String(error);
    const isClientError =
      msg.includes("sold out") ||
      msg.includes("insufficient quantity") ||
      msg.includes("missing") ||
      msg.includes("no longer available") ||
      msg.includes("Not enough available") ||
      msg.includes("not found") ||
      msg.includes("requires an event");

    return NextResponse.json(
      { error: msg || "An unexpected error occurred during checkout." },
      { status: isClientError ? 400 : 500 }
    );
  }
}