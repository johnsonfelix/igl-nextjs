// /app/api/events/[id]/checkout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { sendEmail } from "@/lib/email";

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
    companyId: incomingCompanyId,
    coupon: couponInput,
    shippingAddress,
    billingAddress,
    paymentMethod,
    account, // Extract account
  }: {
    cartItems: CartItem[];
    companyId: string;
    coupon?: { id?: string; code?: string };
    shippingAddress?: any;
    billingAddress?: any;
    paymentMethod?: string;
    account?: any; // Define account type
  } = body;

  // Validation: companyId OR account info
  if ((!incomingCompanyId && (!account || !account.email)) || !cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return NextResponse.json({ error: "Missing required fields (cart or account)" }, { status: 400 });
  }

  // Allow eventId to be empty for membership-only purchases
  const finalEventId = eventId && eventId !== 'undefined' ? eventId : null;

  try {
    console.log("--- STARTING CHECKOUT TRANSACTION ---");

    const result = await prisma.$transaction(async (tx) => {
      let companyId = incomingCompanyId;

      // Logic to resolve Company ID if not provided (Guest Checkout)
      if (!companyId && account && account.email) {
        const email = String(account.email).toLowerCase().trim();
        const existingUser = await tx.user.findUnique({ where: { email } });

        if (existingUser) {
          // Existing User -> Link to their Company
          const userCompany = await tx.company.findFirst({ where: { userId: existingUser.id } });
          if (userCompany) {
            companyId = userCompany.id;
            console.log(`[INFO] Found existing user ${email}, linking to company ${companyId}`);
          } else {
            // User exists but has no company? Create one or handle error?
            // Should ideally verify if they have a company. If not, create one.
            // For now assuming active users have companies or we create one.
            // Let's create a company for the existing user if missing (rare case)
            console.log(`[INFO] Found existing user ${email} but no company. Creating company.`);
            const newCompany = await tx.company.create({
              data: {
                name: account.companyName || account.name || "Default Company",
                memberId: `MEM-${Math.floor(100000 + Math.random() * 900000)}`,
                userId: existingUser.id,
                location: {
                  create: {
                    address: account.address1 || "",
                    city: billingAddress?.city || "",
                    country: billingAddress?.country || "Unknown", // Fallback
                    contactPersonDesignation: account.designation,
                  }
                }
              }
            });
            companyId = newCompany.id;
          }
        } else {
          // New User -> Create User, Company
          console.log(`[INFO] Creating new user for ${email}`);
          const tempPassword = Math.random().toString(36).slice(-8) + "Aa1!";
          const hashedPassword = await hash(tempPassword, 10);

          const newUser = await tx.user.create({
            data: {
              email,
              password: hashedPassword,
              name: account.name,
              phone: account.phone,
              role: "USER"
            }
          });

          // Send credential email (Fire and forget, or await?)
          // We await to ensure valid email or catch error, although we don't want to fail valid payment?
          // Let's await but wrap in try catch to not block order
          await sendEmail({
            to: email,
            subject: "Your Account for IGLA 2026",
            html: `
               <div style="font-family: sans-serif; padding: 20px;">
                 <h2>Welcome to IGLA 2026</h2>
                 <p>Thank you for registering. An account has been created for you.</p>
                 <p><strong>Email:</strong> ${email}</p>
                 <p><strong>Temporary Password:</strong> ${tempPassword}</p>
                 <p>Please <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login">login</a> and change your password.</p>
               </div>
             `
          }).catch(err => console.error("Failed to send welcome email:", err));

          const newCompany = await tx.company.create({
            data: {
              name: account.companyName || account.name || "Default Company",
              userId: newUser.id,
              memberId: `MEM-${Math.floor(100000 + Math.random() * 900000)}`,
              location: {
                create: {
                  address: account.address1 || "",
                  city: billingAddress?.city || "",
                  country: billingAddress?.country || "Unknown",
                  contactPersonDesignation: account.designation,
                }
              }
            }
          });
          companyId = newCompany.id;
          console.log(`[INFO] Created new user ${newUser.id} and company ${newCompany.id}`);
        }
      }

      // Fallback validation
      if (!companyId) {
        throw new Error("Could not determine or create a company for this order.");
      }

      // Create a PurchaseOrder
      const isOffline = paymentMethod === 'offline';

      const purchaseOrder = await tx.purchaseOrder.create({
        data: {
          companyId,
          eventId: finalEventId,
          totalAmount: 0,
          status: "PENDING",
          // Save address fields
          shippingAddressLine1: shippingAddress?.line1,
          shippingAddressLine2: shippingAddress?.line2,
          shippingCity: shippingAddress?.city,
          shippingState: shippingAddress?.state,
          shippingZip: shippingAddress?.zip,
          shippingCountry: shippingAddress?.country,
          billingAddressLine1: billingAddress?.line1,
          billingAddressLine2: billingAddress?.line2,
          billingCity: billingAddress?.city,
          billingState: billingAddress?.state,
          billingZip: billingAddress?.zip,
          billingCountry: billingAddress?.country,
          offlinePayment: isOffline,
          // Save comprehensive order details
          account: account || {},
          additionalDetails: body.additionalDetails || {},
          paymentMethod: paymentMethod || "online",
        },
      });
      console.log(`[OK] Created PurchaseOrder ${purchaseOrder.id} (Offline: ${isOffline})`);

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
          `Processing item: ${originalItem.name} (incoming: ${originalItem.productType ?? originalItem.clientProductType
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

            if (!isOffline) {
              await tx.eventTicket.update({
                where: { eventId_ticketId: { eventId: finalEventId, ticketId: item.productId } },
                data: { quantity: { decrement: item.quantity } },
              });
              console.log(`[OK] Decremented quantity for Ticket: ${item.name}`);
            } else {
              console.log(`[INFO] Offline payment - Skipping stock reduction for Ticket: ${item.name}`);
            }
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

            if (!isOffline) {
              await tx.eventSponsorType.update({
                where: { eventId_sponsorTypeId: { eventId: finalEventId, sponsorTypeId: item.productId } },
                data: { quantity: { decrement: item.quantity } },
              });
              console.log(`[OK] Decremented quantity for Sponsor: ${item.name}`);
            } else {
              console.log(`[INFO] Offline payment - Skipping stock reduction for Sponsor: ${item.name}`);
            }
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

            if (!isOffline) {
              const updatedEventRoomType = await tx.eventRoomType.update({
                where: { eventId_roomTypeId: { eventId: finalEventId, roomTypeId: item.roomTypeId } },
                data: { quantity: { decrement: item.quantity } },
              });

              console.log(
                `[OK] Decremented quantity for Hotel Room: ${item.name}. New quantity: ${updatedEventRoomType.quantity}.`
              );
            } else {
              console.log(`[INFO] Offline payment - Skipping stock reduction for Hotel Room: ${item.name}`);
            }
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

            if (!isOffline) {
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
            } else {
              console.log(`[INFO] Offline payment - Skipping stock reduction for Booth: ${item.name}`);
            }
            break;
          }

          case "MEMBERSHIP": {
            // For offline payments, we DO NOT activate membership yet.
            // It will be activated upon admin approval.
            if (isOffline) {
              console.log(`[INFO] Offline payment for membership: ${item.name}. activation deferred.`);
            } else {
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
            }
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
        discountAmount: discountAmount,
      };

      // If offline -> keep PENDING, otherwise COMPLETED
      // (Assuming online payment means instant success for now, as no gateway integration visible here)
      if (isOffline) {
        updateData.status = "PENDING";
      } else {
        updateData.status = "COMPLETED";
      }

      if (couponRecord) {
        updateData.couponId = couponRecord.id;
      }

      const finalOrder = await tx.purchaseOrder.update({
        where: { id: purchaseOrder.id },
        data: updateData,
        include: { items: true },
      });

      console.log(
        `[OK] Finalized PurchaseOrder ${finalOrder.id} with total ${finalOrder.totalAmount}. Status: ${finalOrder.status}`
      );

      return finalOrder;
    });

    console.log("--- CHECKOUT TRANSACTION COMPLETED SUCCESSFULLY ---");

    // --- Send Email Notification ---
    try {
      const finalOrder = result;
      const attendees = body.additionalDetails?.attendees;

      // Determine recipient: Attendee 1's email or fallback to account email
      let recipientEmail = account.email;
      let recipientName = account.name;

      if (Array.isArray(attendees) && attendees.length > 0 && attendees[0].email) {
        recipientEmail = attendees[0].email;
        recipientName = attendees[0].name || recipientName;
      }

      if (recipientEmail) {
        console.log(`[INFO] Sending invoice email to ${recipientEmail}`);

        const invoiceHtml = generateInvoiceEmailHtml({
          order: finalOrder,
          account,
          attendees,
          billingAddress
        });

        await sendEmail({
          to: recipientEmail,
          subject: `Order Confirmation & Invoice - #${finalOrder.invoiceNumber ? `IGLA${10000 + finalOrder.invoiceNumber}` : finalOrder.id.slice(-8).toUpperCase()}`,
          html: invoiceHtml
        });
        console.log(`[OK] Email sent successfully to ${recipientEmail}`);
      } else {
        console.warn("[WARN] No recipient email found, skipping email notification.");
      }
    } catch (emailError) {
      console.error("Failed to send checkout email:", emailError);
      // We do not fail the request if email fails, as the order is already created
    }

    return NextResponse.json(result, { status: 201 });

    // Helper to generate HTML email
    function generateInvoiceEmailHtml({ order, account, attendees, billingAddress }: any) {
      const invoiceNo = order.invoiceNumber ? `IGLA${10000 + order.invoiceNumber}` : order.id.slice(-8).toUpperCase();
      const dateStr = new Date().toLocaleDateString();
      const totalAmount = order.totalAmount;

      // Format Items
      const itemsHtml = order.items.map((item: any) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${item.price.toLocaleString()}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">$${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join('');

      return `
    <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; color: #333;">
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-bottom: 2px solid #004aad;">
        <h2 style="color: #004aad; margin: 0;">Order Confirmation</h2>
      </div>
      
      <div style="padding: 20px;">
        <p style="font-size: 16px; line-height: 1.5;">
          Dear ${account.name},
        </p>
        
        <p style="font-size: 16px; line-height: 1.5; background-color: #e6fffa; border: 1px solid #b2f5ea; padding: 15px; border-radius: 5px; color: #234e52;">
          <strong>Your order placed successfully and complete the payment process and update the payment details in your order page</strong>
        </p>

        <div style="margin-top: 30px; border: 1px solid #eee; border-radius: 5px; overflow: hidden;">
          <div style="background-color: #00317a; color: white; padding: 10px 15px;">
            <h3 style="margin: 0;">Invoice #${invoiceNo}</h3>
          </div>
          
          <div style="padding: 20px;">
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="width: 50%; vertical-align: top;">
                  <strong>Billed To:</strong><br>
                  ${account.companyName}<br>
                  ${account.name}<br>
                  ${billingAddress?.line1 || ''}<br>
                  ${billingAddress?.city || ''}, ${billingAddress?.country || ''}
                </td>
                <td style="width: 50%; vertical-align: top; text-align: right;">
                  <strong>Date:</strong> ${dateStr}<br>
                  <strong>Total Amount:</strong> $${totalAmount.toLocaleString()}
                </td>
              </tr>
            </table>

            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                  <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
                  <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold;">Grand Total</td>
                  <td style="padding: 15px; text-align: right; font-weight: bold; font-size: 18px; color: #004aad;">$${totalAmount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style="margin-top: 30px; font-size: 14px; color: #666;">
          <h4 style="color: #00317a;">Payment Information (Bank Transfer)</h4>
          <p>
            Beneficiary's Bank: HDFC Bank Limited<br>
            Branch: G N Chetty rd Branch, TNagar<br>
            SWIFT CODE: HDFCINBBCHE<br>
            ACCOUNT NAME: INNOVATIVE GLOBAL LOGISTICS ALLIANZ<br>
            ACCOUNT NO: 50200035538980
          </p>
        </div>
        
        <div style="margin-top: 20px; text-align: center; font-size: 12px; color: #999;">
          <p>&copy; 2026 Innovative Global Logistics Allianz. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
    }
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