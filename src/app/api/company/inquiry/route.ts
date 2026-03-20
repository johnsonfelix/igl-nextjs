import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const excludeCompanyId = searchParams.get("excludeCompanyId");

  try {
    const where = excludeCompanyId
      ? { companyId: { not: excludeCompanyId } }
      : {};

    const inquiries = await prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        company: {
          select: {
            name: true,
          },
        },
      },
    });

    const formattedInquiries = inquiries.map((inq) => ({
      ...inq,
      companyName: inq.company?.name,
    }));

    return NextResponse.json({ inquiries: formattedInquiries });
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch inquiries" }, { status: 500 });
  }
}

// POST /api/inquiry
export async function POST(req: Request) {
  const body = await req.json();

  // Validate minimal fields before proceeding
  if (!body.companyId || !body.from || !body.to || !body.commodity || !body.contactEmail) {
    return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  }

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        companyId: body.companyId,
        from: body.from,
        to: body.to,
        commodity: body.commodity,
        shipmentMode: body.shipmentMode ?? "",
        cargoType: body.cargoType ?? "",
        weight: body.weight,
        volume: body.volume,
        cargoReadyTime: body.cargoReadyTime ? new Date(body.cargoReadyTime) : undefined,
        freightTerm: body.freightTerm ?? "",
        incoterms: body.incoterms ?? "",
        remark: body.remark ?? "",
        dimensions: body.dimensions ?? "",
        contactName: body.contactName ?? "",
        contactEmail: body.contactEmail,
        contactPhone: body.contactPhone ?? ""
      }
    });
    return NextResponse.json({ success: true, id: inquiry.id });
  } catch (e) {
  return NextResponse.json({ error: `Error creating inquiry: ${e}` }, { status: 500 });
}
}
