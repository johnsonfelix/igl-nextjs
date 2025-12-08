import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

type PaymentPayload = {
  provider?: string;
  transactionId?: string;
  amount?: number;
};

// keep this in sync with your Prisma OfferScope enum
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

    // Fetch company + plan
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

    // ─────────────────────────────────────────────
    // 1. LOAD ACTIVE MEMBERSHIP OFFERS
    // ─────────────────────────────────────────────
    const allOffers = await prisma.offer.findMany({
      where: {
        isActive: true,
        // scope filter left broad; we filter in code
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

    // Find best offer for this membership plan
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
        // CUSTOM -> check membershipPlans relation
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

    // ─────────────────────────────────────────────
    // 2. CALCULATE DISCOUNTED AMOUNTS
    // ─────────────────────────────────────────────
    const originalPrice = plan.price;
    const membershipDiscountAmount = bestOffer
      ? (originalPrice * bestOffer.percentage) / 100
      : 0;

    // For now, coupon logic is left as 0 or TODO.
    // If you want real coupons, validate `coupon` against prisma.coupon here.
    const couponDiscountAmount = 0; // TODO: implement coupon-based discount if needed

    const finalPrice = Math.max(
      0,
      originalPrice - membershipDiscountAmount - couponDiscountAmount
    );

    // Optional: compare `payment?.amount` with `finalPrice` if you want strict enforcement
    // if (payment && typeof payment.amount === "number" && payment.amount !== finalPrice) {
    //   return NextResponse.json(
    //     {
    //       error: "Payment amount mismatch",
    //       detail: `Expected ${finalPrice}, got ${payment.amount}`,
    //     },
    //     { status: 400 }
    //   );
    // }

    // ─────────────────────────────────────────────
    // 3. UPDATE MEMBERSHIP IN A TRANSACTION
    // ─────────────────────────────────────────────
    const baseStart =
      company.membershipExpiresAt &&
      company.membershipExpiresAt > now
        ? company.membershipExpiresAt
        : now;

    const expires =
      typeof durationDays === "number" && durationDays > 0
        ? new Date(
            baseStart.getTime() +
              durationDays *
                24 *
                60 *
                60 *
                1000
          )
        : null;

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.company.update({
        where: { id: companyId },
        data: {
          membershipPlan: {
            connect: { id: membershipPlanId },
          }, // sets FK and relation
          purchasedMembership: plan.name, // legacy display
          purchasedAt: now,
          membershipExpiresAt: expires,
          memberType: "PAID",
          memberSince: company.memberSince ?? now,
          // If you want to store applied offer on company, you can
          // add fields like appliedOfferId, lastMembershipDiscount, etc.
        },
        include: { membershipPlan: true },
      });

      // Optionally, you could store a purchase record here as well.

      return u;
    });

    // ─────────────────────────────────────────────
    // 4. RETURN RESULT WITH PRICING & OFFER INFO
    // ─────────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        company: updated,
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
