import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// ✅ GET all agenda items for an event
export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.pathname.split("/")[3]; // correct extraction

    if (!eventId) {
      return NextResponse.json({ error: "Event ID not found in URL" }, { status: 400 });
    }

    const agendaItems = await prisma.agendaItem.findMany({
      where: { eventId },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json(agendaItems);
  } catch (error) {
    console.error("[AGENDA_GET]", error);
    return NextResponse.json({ error: "Failed to fetch agenda items" }, { status: 500 });
  }
}

// ✅ CREATE agenda item for an event
export async function POST(req: NextRequest) {
  try {
    const eventId = req.nextUrl.pathname.split("/")[3];

    if (!eventId) {
      return NextResponse.json({ error: "Event ID not found in URL" }, { status: 400 });
    }

    const body = await req.json();
    console.log("Request body:", body);

    const { title, description, startTime, endTime } = body;

    if (
      typeof title !== "string" ||
      typeof startTime !== "string" ||
      typeof endTime !== "string" ||
      !title.trim() ||
      !startTime.trim() ||
      !endTime.trim()
    ) {
      return NextResponse.json({ error: "Missing or invalid required fields" }, { status: 400 });
    }

    const parsedStartTime = new Date(startTime);
    const parsedEndTime = new Date(endTime);

    if (isNaN(parsedStartTime.getTime()) || isNaN(parsedEndTime.getTime())) {
      return NextResponse.json({ error: "Invalid date or time format provided" }, { status: 400 });
    }

    // Autogenerate date from startTime
    const parsedDate = new Date(parsedStartTime.toISOString().split("T")[0]);

    const agendaItem = await prisma.agendaItem.create({
      data: {
        title,
        date: parsedDate,
        description: description || null,
        startTime: parsedStartTime,
        endTime: parsedEndTime,
        eventId,
      },
    });

    return NextResponse.json(agendaItem);
  } catch (error) {
    console.error("[AGENDA_POST]", error);
    return NextResponse.json({ error: "Failed to create agenda item" }, { status: 500 });
  }
}


