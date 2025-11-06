// app/api/membership/purchase/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

type PaymentPayload = {
  provider?: string;
  transactionId?: string;
  amount?: number;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyId, membershipPlanId, payment, coupon, account, durationDays } = body;

    if (!companyId || !membershipPlanId) {
      return NextResponse.json({ error: "Missing required fields: companyId and membershipPlanId." }, { status: 400 });
    }

    const [company, plan] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId }, select: { id: true, memberSince: true, membershipExpiresAt: true } }),
      prisma.membershipPlan.findUnique({ where: { id: membershipPlanId } }),
    ]);

    if (!company) return NextResponse.json({ error: "Company not found" }, { status: 404 });
    if (!plan) return NextResponse.json({ error: "Membership plan not found" }, { status: 404 });

    // TODO: replace with your real provider verification
    // if (payment && !payment.transactionId) {
    //   return NextResponse.json({ error: "Payment verification failed", detail: "Missing/invalid payment.transactionId" }, { status: 402 });
    // }

    const now = new Date();
    const baseStart = company.membershipExpiresAt && company.membershipExpiresAt > now ? company.membershipExpiresAt : now;
    const expires = typeof durationDays === "number" && durationDays > 0
      ? new Date(baseStart.getTime() + durationDays * 24 * 60 * 60 * 1000)
      : null;

    const updated = await prisma.$transaction(async (tx) => {
      // Attach the plan via relation + keep legacy fields for now
      const u = await tx.company.update({
        where: { id: companyId },
        data: {
          membershipPlan: { connect: { id: membershipPlanId } }, // sets FK and relation
          purchasedMembership: plan.name,                        // legacy display
          purchasedAt: now,
          membershipExpiresAt: expires,
          memberType: "PAID",
          memberSince: company.memberSince ?? now,
        },
        include: { membershipPlan: true },
      });

      return u;
    });

    return NextResponse.json({ success: true, company: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Could not complete membership purchase", detail: err?.message ?? String(err) },
      { status: 500 }
    );
  }
}
