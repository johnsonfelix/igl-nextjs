// D:\Projects\Logistics\web\backend-api\src\app\api\admin\offers\[id]\route.ts
import { NextRequest, NextResponse } from "next/server";
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
  name?: string;
  code?: string | null;
  description?: string | null;
  percentage?: number;
  scope?: OfferScopePayload;
  startsAt?: string | null;
  endsAt?: string | null;
  isActive?: boolean;
  hotelIds?: string[];
  ticketIds?: string[];
  sponsorTypeIds?: string[];
  boothIds?: string[];
  membershipPlanIds?: string[];
};

// helper
function getIdFromRequest(req: NextRequest): string {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

// GET /api/admin/offers/[id]
export async function GET(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const o = await prisma.offer.findUnique({
      where: { id },
      include: {
        hotels: true,
        tickets: true,
        sponsorTypes: true,
        booths: true,
        membershipPlans: true,
      },
    });

    if (!o) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    return NextResponse.json({
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
      membershipPlanIds: (o.membershipPlans || []).map((m) => m.id),
    });
  } catch (err) {
    console.error("GET /api/admin/offers/[id] error:", err);
    return NextResponse.json(
      { error: "Failed to fetch offer" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/offers/[id]
export async function PUT(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    const body = (await req.json()) as OfferPayload;

    if (
      body.percentage !== undefined &&
      (isNaN(body.percentage as number) ||
        (body.percentage as number) <= 0 ||
        (body.percentage as number) > 100)
    ) {
      return NextResponse.json(
        { error: "percentage must be a number between 1 and 100" },
        { status: 400 }
      );
    }

    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.percentage !== undefined) updateData.percentage = body.percentage;
    if (body.scope !== undefined) updateData.scope = body.scope;
    if (body.startsAt !== undefined) {
      updateData.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    }
    if (body.endsAt !== undefined) {
      updateData.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    }
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    // If scope == CUSTOM, replace relations with provided arrays using `set`
    if (body.scope === "CUSTOM") {
      if (Array.isArray(body.hotelIds)) {
        updateData.hotels = {
          set: body.hotelIds.map((id) => ({ id })),
        };
      }
      if (Array.isArray(body.ticketIds)) {
        updateData.tickets = {
          set: body.ticketIds.map((id) => ({ id })),
        };
      }
      if (Array.isArray(body.sponsorTypeIds)) {
        updateData.sponsorTypes = {
          set: body.sponsorTypeIds.map((id) => ({ id })),
        };
      }
      if (Array.isArray(body.boothIds)) {
        updateData.booths = {
          set: body.boothIds.map((id) => ({ id })),
        };
      }
      if (Array.isArray(body.membershipPlanIds)) {
        updateData.membershipPlans = {
          set: body.membershipPlanIds.map((id) => ({ id })),
        };
      }
    } else {
      // optional: clear relations when scope != CUSTOM
      // updateData.hotels = { set: [] };
      // updateData.tickets = { set: [] };
      // updateData.sponsorTypes = { set: [] };
      // updateData.booths = { set: [] };
      // updateData.membershipPlans = { set: [] };
    }

    const updated = await prisma.offer.update({
      where: { id },
      data: updateData,
      include: {
        hotels: true,
        tickets: true,
        sponsorTypes: true,
        booths: true,
        membershipPlans: true,
      },
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      code: updated.code,
      description: updated.description,
      percentage: updated.percentage,
      scope: updated.scope,
      startsAt: updated.startsAt?.toISOString() ?? null,
      endsAt: updated.endsAt?.toISOString() ?? null,
      isActive: updated.isActive,
      hotelIds: (updated.hotels || []).map((h) => h.id),
      ticketIds: (updated.tickets || []).map((t) => t.id),
      sponsorTypeIds: (updated.sponsorTypes || []).map((s) => s.id),
      boothIds: (updated.booths || []).map((b) => b.id),
      membershipPlanIds: (updated.membershipPlans || []).map((m) => m.id),
    });
  } catch (err: any) {
    console.error("PUT /api/admin/offers/[id] error:", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update offer" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/offers/[id]
export async function DELETE(req: NextRequest) {
  const id = getIdFromRequest(req);

  try {
    await prisma.offer.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/admin/offers/[id] error:", err);
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 }
    );
  }
}
