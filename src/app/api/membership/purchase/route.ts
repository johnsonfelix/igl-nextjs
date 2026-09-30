import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

type PaymentPayload = {
  provider?: string;
  transactionId?: string;
  amount?: number;
};


type OfferScope =
  | "ALL"
  | "HOTELS"
  | "TICKETS"
  | "SPONSORS"
  | "BOOTHS"
  | "SUBSCRIPTIONS"
  | "CUSTOM";

export async function POST(req: NextRequest) {

  try {
    const body = await req.json();
    const {
      companyId,
      membershipPlanId,
      payment,
      coupon,
      account,
      durationDays,
    } = body;

    if (!companyId || !membershipPlanId) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: companyId and membershipPlanId.",
        },
        { status: 400 }
      );
    }

    
    const [company, plan] = await Promise.all([
      prisma.company.findUnique({
        where: { id: companyId },
        select: {
          id: true,
          memberSince: true,
          membershipExpiresAt: true,
        },
      }),
      prisma.membershipPlan.findUnique({
        where: { id: membershipPlanId },
      }),
    ]);

    if (!company) {
      return NextResponse.json(
        { error: "Company not found" },
        { status: 404 }
      );
    }
    if (!plan) {
      return NextResponse.json(
        { error: "Membership plan not found" },
        { status: 404 }
      );
    }

    
    
    
    const allOffers = await prisma.offer.findMany({
      where: {
        isActive: true,
        
      },
      include: {
        membershipPlans: { select: { id: true } },
      },
    });

    const now = new Date();

    const isOfferActive = (o: (typeof allOffers)[number]): boolean => {
      if (!o.isActive) return false;
      if (o.startsAt && o.startsAt > now) return false;
      if (o.endsAt && o.endsAt < now) return false;
      return true;
    };

    
    let bestOffer:
      | (typeof allOffers)[number]
      | null = null;

    for (const o of allOffers) {
      const scope = o.scope as OfferScope;
      if (!isOfferActive(o)) continue;

      let applies = false;

      if (scope === "ALL" || scope === "SUBSCRIPTIONS") {
        applies = true;
      } else if (scope === "CUSTOM") {
        
        const ids = (o.membershipPlans || []).map((m) => m.id);
        if (ids.includes(membershipPlanId)) {
          applies = true;
        }
      }

      if (!applies) continue;

      if (!bestOffer || o.percentage > bestOffer.percentage) {
        bestOffer = o;
      }
    }

    
    
    
    const originalPrice = plan.price;
    const membershipDiscountAmount = bestOffer
      ? (originalPrice * bestOffer.percentage) / 100
      : 0;

    
    
    const couponDiscountAmount = 0; 

    const finalPrice = Math.max(
      0,
      originalPrice - membershipDiscountAmount - couponDiscountAmount
    );

    
    if (finalPrice > 0 && payment && typeof payment.amount === "number" && payment.amount !== finalPrice) {
      
      
    }


    
    
    
    const baseStart =
      company.membershipExpiresAt &&
        company.membershipExpiresAt > now
        ? company.membershipExpiresAt
        : now;

    const expires =
      durationDays === null 
        ? null
        : typeof durationDays === "number" && durationDays > 0
          ? new Date(
            baseStart.getTime() +
            durationDays *
            24 *
            60 *
            60 *
            1000
          )
          : null;

    const isOffline =
      body.isOffline === true ||
      body.isOffline === "true" ||
      (payment?.provider && payment.provider.toUpperCase() === "OFFLINE");

    console.log("DEBUG PURCHASE: payment=", payment, "body.isOffline=", body.isOffline, "FINAL isOffline=", isOffline);


    const { updatedCompany, createdPurchaseOrder } = await prisma.$transaction(async (tx) => {
      let u = company;

      
      if (!isOffline) {
        console.log("DEBUG: PERFORMING COMPANY UPDATE (Online)");
        u = await tx.company.update({
          where: { id: companyId },
          data: {
            membershipPlan: {
              connect: { id: membershipPlanId },
            },
            purchasedMembership: plan.name,
            purchasedAt: now,
            membershipExpiresAt: expires,
            memberType: "PAID",
            memberSince: company.memberSince ?? now,
          },
          include: { membershipPlan: true },
        });
      } else {
        console.log("DEBUG: SKIPPING COMPANY UPDATE (Offline)");
      }

      
      const po = await tx.purchaseOrder.create({
        data: {
          companyId: companyId,
          totalAmount: finalPrice,
          status: "PENDING",
          offlinePayment: isOffline,
          items: {
            create: {
              productType: "MEMBERSHIP",
              productId: membershipPlanId,
              name: `Membership: ${plan.name}`,
              quantity: 1,
              price: finalPrice
            }
          },
        },
        include: {
          items: true
        }
      });

      return { updatedCompany: u, createdPurchaseOrder: po };
    });

    
    
    
    return NextResponse.json(
      {
        success: true,
        company: updatedCompany,
        purchaseOrder: createdPurchaseOrder,
        pricing: {
          originalPrice,
          membershipDiscountAmount,
          couponDiscountAmount,
          finalPrice,
          appliedOffer: bestOffer
            ? {
              id: bestOffer.id,
              name: bestOffer.name,
              percentage: bestOffer.percentage,
              scope: bestOffer.scope,
            }
            : null,
          couponCode: coupon ?? null,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("membership purchase error:", err);
    return NextResponse.json(
      {
        error: "Could not complete membership purchase",
        detail: err?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
