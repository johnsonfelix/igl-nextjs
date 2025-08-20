// /app/api/events/[id]/checkout/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface CartItem {
  productId: string;
  productType: 'TICKET' | 'SPONSOR' | 'HOTEL' | 'BOOTH';
  quantity: number;
  price: number;
  name: string;
  roomTypeId?: string;
  boothSubTypeId?: string;
}

export async function POST(
  request: Request,
  // Change 1: The 'params' object is now wrapped in a Promise.
  { params }: { params: Promise<{ id: string }> }
) {
  // Change 2: You must 'await' the params to access the 'id'.
  const { id: eventId } = await params;
  let body;

  try {
    body = await request.json();
  } catch (e) {
    console.error("Failed to parse request JSON:", e);
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { cartItems, companyId }: { cartItems: CartItem[], companyId: string } = body;

  if (!eventId || !companyId || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    console.log("--- STARTING CHECKOUT TRANSACTION ---");
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create a PurchaseOrder
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

      for (const item of cartItems) {
        console.log(`Processing item: ${item.name} (Type: ${item.productType})`);
        
        switch (item.productType) {
          case 'TICKET':
            // Ticket logic...
            const eventTicket = await tx.eventTicket.findUnique({ where: { eventId_ticketId: { eventId, ticketId: item.productId } } });
            if (!eventTicket || eventTicket.quantity < item.quantity) throw new Error(`Ticket "${item.name}" is sold out.`);
            await tx.eventTicket.update({ where: { eventId_ticketId: { eventId, ticketId: item.productId } }, data: { quantity: { decrement: item.quantity } } });
            console.log(`[OK] Decremented quantity for Ticket: ${item.name}`);
            break;

          case 'SPONSOR':
            // Sponsor logic...
            const eventSponsor = await tx.eventSponsorType.findUnique({ where: { eventId_sponsorTypeId: { eventId, sponsorTypeId: item.productId } } });
            if (!eventSponsor || eventSponsor.quantity < item.quantity) throw new Error(`Sponsor pack "${item.name}" is sold out.`);
            await tx.eventSponsorType.update({ where: { eventId_sponsorTypeId: { eventId, sponsorTypeId: item.productId } }, data: { quantity: { decrement: item.quantity } } });
            console.log(`[OK] Decremented quantity for Sponsor: ${item.name}`);
            break;

          case 'HOTEL':
            if (!item.roomTypeId) throw new Error("Room Type ID is missing for hotel booking.");
            
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

            console.log(`[OK] Decremented quantity for Hotel Room: ${item.name}. New quantity is now ${updatedEventRoomType.quantity}.`);
            break;

          case 'BOOTH':
            // Booth logic...
            if (!item.boothSubTypeId) throw new Error("Booth Sub-Type ID is missing for booth booking.");
            const boothSubType = await tx.boothSubType.findUnique({ where: { id: item.boothSubTypeId } });
            if (!boothSubType || !boothSubType.isAvailable) throw new Error(`Booth "${item.name}" is no longer available.`);
            await tx.boothSubType.update({ where: { id: item.boothSubTypeId }, data: { isAvailable: false } });
            console.log(`[OK] Marked Booth as sold: ${item.name}`);
            break;

          default:
            throw new Error(`Unknown product type: ${item.productType}`);
        }

        // Create OrderItem
        await tx.orderItem.create({
          data: {
            orderId: purchaseOrder.id,
            productId: item.productId,
            productType: item.productType,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            roomTypeId: item.roomTypeId,
            boothSubTypeId: item.boothSubTypeId,
          },
        });
        console.log(`[OK] Created OrderItem for: ${item.name}`);
        
        calculatedTotal += item.price * item.quantity;
      }

      // Finalize the PurchaseOrder
      const finalOrder = await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: {
          totalAmount: calculatedTotal,
          status: 'COMPLETED',
        },
        include: { items: true },
      });
      console.log(`[OK] Finalized PurchaseOrder ${finalOrder.id} with total ${finalOrder.totalAmount}`);

      return finalOrder;
    });

    console.log("--- CHECKOUT TRANSACTION COMPLETED SUCCESSFULLY ---");
    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    console.error("--- CHECKOUT TRANSACTION FAILED ---");
    console.error("Error during checkout:", error); 
    
    const isClientError = error.message.includes('sold out') || error.message.includes('insufficient quantity') || error.message.includes('missing') || error.message.includes('no longer available');
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred during checkout.' },
      { status: isClientError ? 400 : 500 }
    );
  }
}
