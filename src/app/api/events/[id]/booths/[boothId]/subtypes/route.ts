import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(request: NextRequest) {
  try {
    // Parse the eventId and boothId from request.url by splitting:
    // Example url: http://localhost:3000/api/events/evt123/booths/boo456/subtypes
    const url = new URL(request.url);
    // The pathname is /api/events/evt123/booths/boo456/subtypes
    const segments = url.pathname.split("/").filter(Boolean);
    // segments = ["api", "events", "evt123", "booths", "boo456", "subtypes"]

    // Find indices and extract eventId and boothId dynamically or by position:
    const eventIndex = segments.indexOf("events");
    const boothIndex = segments.indexOf("booths");

    if (eventIndex === -1 || boothIndex === -1 || boothIndex + 1 >= segments.length) {
      return NextResponse.json(
        { error: "Invalid URL parameters" },
        { status: 400 }
      );
    }

    const eventId = segments[eventIndex + 1];
    const boothId = segments[boothIndex + 1];

    const body = await request.json();
    const subTypes = body.subTypes;

    if (!Array.isArray(subTypes)) {
      return NextResponse.json(
        { error: "subTypes must be an array" },
        { status: 400 }
      );
    }

    // Rest of your logic remains same, using extracted eventId and boothId

    const current = await prisma.boothSubType.findMany({
      where: { eventId, boothId },
    });

    const upserts = await Promise.all(
      subTypes.map(async (st) => {
        if (st.id) {
          return prisma.boothSubType.update({
            where: { id: st.id },
            data: {
              name: st.name,
              price: st.price,
              description: st.description,
            },
          });
        } else {
          return prisma.boothSubType.create({
            data: {
              name: st.name,
              price: st.price,
              description: st.description,
              boothId,
              eventId,
            },
          });
        }
      })
    );

    const inputIds = subTypes.filter((st) => st.id).map((st) => st.id);
    const toDelete = current.filter((st) => !inputIds.includes(st.id));
    await Promise.all(
      toDelete.map((del) =>
        prisma.boothSubType.delete({ where: { id: del.id } })
      )
    );

    return NextResponse.json({ subTypes: upserts }, { status: 200 });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err.message || "Internal error" },
      { status: 500 }
    );
  }
}
