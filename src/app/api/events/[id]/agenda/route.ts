import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// ✅ GET all agenda items for an event
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    const agendaItems = await prisma.agendaItem.findMany({
      where: { eventId },
      orderBy: { date: "asc" },
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
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const eventId = pathnameParts[pathnameParts.length - 1];

    const body = await req.json();
    const { date, startTime, endTime, title, description } = body;

    if (!date || !startTime || !endTime || !title) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const agendaItem = await prisma.agendaItem.create({
      data: {
        date: new Date(date),
        startTime,
        endTime,
        title,
        description: description || null,
        eventId,
      },
    });
    return NextResponse.json(agendaItem);
  } catch (error) {
    console.error("[AGENDA_POST]", error);
    return NextResponse.json({ error: "Failed to create agenda item" }, { status: 500 });
  }
}
