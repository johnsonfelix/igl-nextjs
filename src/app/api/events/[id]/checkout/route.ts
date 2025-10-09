// /app/api/events/[id]/checkout/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  let body: any;

  try {
    body = await request.json();
  } catch (e) {
    console.error('Failed to parse request JSON:', e);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { cartItems, companyId, coupon: couponInput }:
    { cartItems: CartItem[]; companyId: string; coupon?: { id?: string; code?: string } } = body;

  if (!eventId || !companyId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    console.log('--- STARTING CHECKOUT TRANSACTION ---');

    const result = await prisma.$transaction(async (tx) => {
      // Create a PurchaseOrder (initial stub)
      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          companyId,
          eventId,
          totalAmount: 0,
          status: 'PENDING',
        },
      });
      console.log(`[OK] Created PurchaseOrder ${purchaseOrder.id}`);

      let calculatedTotal = 0;

      for (const originalItem of cartItems) {
        const rawType = (originalItem.productType ?? originalItem.clientProductType ?? 'PRODUCT').toString().toUpperCase();
        const allowedTypes = ['TICKET', 'SPONSOR', 'HOTEL', 'BOOTH', 'MEMBERSHIP', 'PRODUCT'];
        const productType = allowedTypes.includes(rawType) ? rawType : 'PRODUCT';

        console.log(`Processing item: ${originalItem.name} (incoming: ${originalItem.productType ?? originalItem.clientProductType}, mapped: ${productType})`);

        const item = {
          productId: originalItem.productId,
          productType,
          quantity: originalItem.quantity,
          price: originalItem.price,
          name: originalItem.name,
          roomTypeId: originalItem.roomTypeId,
          boothSubTypeId: originalItem.boothSubTypeId,
        };

        // inventory & booking logic (unchanged)
        switch (productType) {
          case 'TICKET': {
            const eventTicket = await tx.eventTicket.findUnique({
              where: { eventId_ticketId: { eventId, ticketId: item.productId } },
            });
            if (!eventTicket || eventTicket.quantity < item.quantity) {
              throw new Error(`Ticket "${item.name}" is sold out or insufficient quantity.`);
            }
            await tx.eventTicket.update({
              where: { eventId_ticketId: { eventId, ticketId: item.productId } },
              data: { quantity: { decrement: item.quantity } },
            });
            console.log(`[OK] Decremented quantity for Ticket: ${item.name}`);
            break;
          }

          case 'SPONSOR': {
            const eventSponsor = await tx.eventSponsorType.findUnique({
              where: { eventId_sponsorTypeId: { eventId, sponsorTypeId: item.productId } },
            });
            if (!eventSponsor || eventSponsor.quantity < item.quantity) {
              throw new Error(`Sponsor pack "${item.name}" is sold out or insufficient quantity.`);
            }
            await tx.eventSponsorType.update({
              where: { eventId_sponsorTypeId: { eventId, sponsorTypeId: item.productId } },
              data: { quantity: { decrement: item.quantity } },
            });
            console.log(`[OK] Decremented quantity for Sponsor: ${item.name}`);
            break;
          }

          case 'HOTEL': {
            if (!item.roomTypeId) throw new Error('Room Type ID is missing for hotel booking.');
            const eventRoomType = await tx.eventRoomType.findUnique({
              where: { eventId_roomTypeId: { eventId, roomTypeId: item.roomTypeId } },
            });

            console.log(`Found EventRoomType for room ${item.name}. Current quantity: ${eventRoomType?.quantity}`);

            if (!eventRoomType || eventRoomType.quantity < item.quantity) {
              throw new Error(`Room type "${item.name}" is sold out or has insufficient quantity.`);
            }

            const updatedEventRoomType = await tx.eventRoomType.update({
              where: { eventId_roomTypeId: { eventId, roomTypeId: item.roomTypeId } },
              data: { quantity: { decrement: item.quantity } },
            });

            console.log(`[OK] Decremented quantity for Hotel Room: ${item.name}. New quantity: ${updatedEventRoomType.quantity}.`);
            break;
          }

          case 'BOOTH': {
            if (!item.boothSubTypeId) throw new Error('Booth Sub-Type ID is missing for booth booking.');
            const boothSubType = await tx.boothSubType.findUnique({ where: { id: item.boothSubTypeId } });
            if (!boothSubType || !boothSubType.isAvailable) throw new Error(`Booth "${item.name}" is no longer available.`);
            await tx.boothSubType.update({ where: { id: item.boothSubTypeId! }, data: { isAvailable: false } });
            console.log(`[OK] Marked Booth as sold: ${item.name}`);
            break;
          }

          case 'MEMBERSHIP':
          case 'PRODUCT': {
            console.log(`[OK] Recording ${productType} item (no inventory changes): ${item.name}`);
            break;
          }

          default: {
            console.warn(`Unhandled product type "${productType}" for item ${item.name} — treating as PRODUCT.`);
            break;
          }
        }

        // Create OrderItem record for every item
        await tx.orderItem.create({
          data: {
            orderId: purchaseOrder.id,
            productId: item.productId,
            productType: productType,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            roomTypeId: item.roomTypeId,
            boothSubTypeId: item.boothSubTypeId,
          },
        });
        console.log(`[OK] Created OrderItem for: ${item.name}`);

        calculatedTotal += item.price * item.quantity;
      } // end for items

      console.log(`[INFO] Calculated subtotal: ${calculatedTotal}`);

      // ---- COUPON VALIDATION & DISCOUNT calculation (server-side authoritative) ----
      let discountAmount = 0;
      let couponRecord = null;

      if (couponInput) {
        // prefer id, then code
        if (couponInput.id) {
          couponRecord = await tx.coupon.findUnique({ where: { id: couponInput.id } });
        }
        if (!couponRecord && couponInput.code) {
          couponRecord = await tx.coupon.findFirst({ where: { code: couponInput.code } });
        }

        if (couponRecord) {
          console.log(`[INFO] Found coupon ${couponRecord.code} (${couponRecord.discountType} ${couponRecord.discountValue})`);
          const dv = Number(couponRecord.discountValue ?? 0);
          if (couponRecord.discountType === 'FIXED') {
            discountAmount = Math.min(dv, calculatedTotal);
          } else {
            // PERCENTAGE
            discountAmount = calculatedTotal * (dv / 100);
          }
          // round to 2 decimals
          discountAmount = Math.round(discountAmount * 100) / 100;
        } else {
          console.log('[INFO] Coupon provided but not found in DB (id/code mismatch). Ignoring coupon for this checkout.');
        }
      } else {
        console.log('[INFO] No coupon provided in request body.');
      }

      const finalTotal = Math.max(0, Math.round((calculatedTotal - discountAmount) * 100) / 100);

      // Finalize the PurchaseOrder: persist discountAmount and coupon relation (if exists)
      const updateData: any = {
        totalAmount: finalTotal,
        status: 'COMPLETED',
        discountAmount: discountAmount,
      };

      if (couponRecord) {
        // if your schema uses couponId as FK or relation, this will work:
        updateData.couponId = couponRecord.id;
      }

      const finalOrder = await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: updateData,
        include: { items: true },
      });

      console.log(`[OK] Finalized PurchaseOrder ${finalOrder.id} with total ${finalOrder.totalAmount} (discount ${discountAmount})`);

      return finalOrder;
    }); // end transaction

    console.log('--- CHECKOUT TRANSACTION COMPLETED SUCCESSFULLY ---');
    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error('--- CHECKOUT TRANSACTION FAILED ---');
    console.error('Error during checkout:', error);

    const msg = error?.message ?? String(error);
    const isClientError =
      msg.includes('sold out') ||
      msg.includes('insufficient quantity') ||
      msg.includes('missing') ||
      msg.includes('no longer available');

    return NextResponse.json({ error: msg || 'An unexpected error occurred during checkout.' }, { status: isClientError ? 400 : 500 });
  }
}
