// D:\Projects\Logistics\web\backend-api\src\app\api\admin\offers\route.ts
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

type OfferScopePayload =
  | "ALL"
  | "HOTELS"
  | "TICKETS"
  | "SPONSORS"
  | "BOOTHS"
  | "SUBSCRIPTIONS"
  | "CUSTOM";

type OfferPayload = {
  name: string;
  code?: string | null;
  description?: string | null;
  percentage: number;
  scope: OfferScopePayload;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  hotelIds?: string[];
  ticketIds?: string[];
  sponsorTypeIds?: string[];
  boothIds?: string[];
  membershipPlanIds?: string[]; // NEW
};

export async function GET() {
  try {
    const offers = await prisma.offer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        hotels: { select: { id: true, hotelName: true } },
        tickets: { select: { id: true, name: true } },
        sponsorTypes: { select: { id: true, name: true } },
        booths: { select: { id: true, name: true } },
        membershipPlans: { select: { id: true, name: true } }, // NEW
      },
    });

    const result = offers.map((o) => ({
      id: o.id,
      name: o.name,
      code: o.code,
      description: o.description,
      percentage: o.percentage,
      scope: o.scope,
      startsAt: o.startsAt?.toISOString() ?? null,
      endsAt: o.endsAt?.toISOString() ?? null,
      isActive: o.isActive,
      hotelIds: (o.hotels || []).map((h) => h.id),
      ticketIds: (o.tickets || []).map((t) => t.id),
      sponsorTypeIds: (o.sponsorTypes || []).map((s) => s.id),
      boothIds: (o.booths || []).map((b) => b.id),
      membershipPlanIds: (o.membershipPlans || []).map((m) => m.id), // NEW
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/admin/offers error:", err);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as OfferPayload;

    if (
      !body.name ||
      typeof body.percentage !== "number" ||
      body.percentage <= 0 ||
      body.percentage > 100
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid payload: name & percentage required (percentage must be 1-100)",
        },
        { status: 400 }
      );
    }

    const data: any = {
      name: body.name,
      code: body.code ?? null,
      description: body.description ?? null,
      percentage: body.percentage,
      scope: body.scope,
      startsAt: body.startsAt ? new Date(body.startsAt) : null,
      endsAt: body.endsAt ? new Date(body.endsAt) : null,
      isActive: body.isActive ?? true,
    };

    // Only connect many-to-many targets if CUSTOM scope
    if (body.scope === "CUSTOM") {
      if (Array.isArray(body.hotelIds) && body.hotelIds.length > 0) {
        data.hotels = { connect: body.hotelIds.map((id) => ({ id })) };
      }
      if (Array.isArray(body.ticketIds) && body.ticketIds.length > 0) {
        data.tickets = { connect: body.ticketIds.map((id) => ({ id })) };
      }
      if (Array.isArray(body.sponsorTypeIds) && body.sponsorTypeIds.length > 0) {
        data.sponsorTypes = {
          connect: body.sponsorTypeIds.map((id) => ({ id })),
        };
      }
      if (Array.isArray(body.boothIds) && body.boothIds.length > 0) {
        data.booths = { connect: body.boothIds.map((id) => ({ id })) };
      }
      if (
        Array.isArray(body.membershipPlanIds) &&
        body.membershipPlanIds.length > 0
      ) {
        data.membershipPlans = {
          connect: body.membershipPlanIds.map((id) => ({ id })),
        };
      }
    }

    const created = await prisma.offer.create({
      data,
      include: {
        hotels: true,
        tickets: true,
        sponsorTypes: true,
        booths: true,
        membershipPlans: true, // NEW -> fixes TS error
      },
    });

    return NextResponse.json({
      id: created.id,
      name: created.name,
      code: created.code,
      description: created.description,
      percentage: created.percentage,
      scope: created.scope,
      startsAt: created.startsAt?.toISOString() ?? null,
      endsAt: created.endsAt?.toISOString() ?? null,
      isActive: created.isActive,
      hotelIds: (created.hotels || []).map((h) => h.id),
      ticketIds: (created.tickets || []).map((t) => t.id),
      sponsorTypeIds: (created.sponsorTypes || []).map((s) => s.id),
      boothIds: (created.booths || []).map((b) => b.id),
      membershipPlanIds: (created.membershipPlans || []).map((m) => m.id), // NEW
    });
  } catch (err) {
    console.error("POST /api/admin/offers error:", err);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 }
    );
  }
}
