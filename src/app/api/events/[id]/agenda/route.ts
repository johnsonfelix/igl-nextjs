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

function normalizeTime(t: string) {
  // Accept "HH:mm" or "HH:mm:ss" — convert "HH:mm" -> "HH:mm:00"
  if (/^\d{1,2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}

// ✅ CREATE agenda item for an event
export async function POST(req: NextRequest) {
  try {
    const eventId = req.nextUrl.pathname.split('/')[3];
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID not found in URL' }, { status: 400 });
    }

    const body = await req.json();
    console.log('Request body:', body);

    const { title, description, date, startTime, endTime } = body;

    if (
      typeof title !== 'string' ||
      typeof date !== 'string' ||
      typeof startTime !== 'string' ||
      typeof endTime !== 'string' ||
      !title.trim() ||
      !date.trim() ||
      !startTime.trim() ||
      !endTime.trim()
    ) {
      return NextResponse.json({ error: 'Missing or invalid required fields' }, { status: 400 });
    }

    // Build full datetimes from date + time (e.g. "2025-08-21T20:26:00")
    const startIso = `${date}T${normalizeTime(startTime)}`;
    const endIso = `${date}T${normalizeTime(endTime)}`;

    const parsedStart = new Date(startIso);
    const parsedEnd = new Date(endIso);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time format provided' }, { status: 400 });
    }

    // Save a date-only value for the `date` column if you use a Date or DateTime in Prisma.
    // Here we create a Date for midnight of the provided date (server local timezone).
    const parsedDate = new Date(date); // "YYYY-MM-DD" -> midnight local

    const agendaItem = await prisma.agendaItem.create({
      data: {
        title,
        date: parsedDate,
        description: description || null,
        startTime: parsedStart,
        endTime: parsedEnd,
        eventId,
      },
    });

    return NextResponse.json(agendaItem, { status: 201 });
  } catch (error) {
    console.error('[AGENDA_POST]', error);
    return NextResponse.json({ error: 'Failed to create agenda item' }, { status: 500 });
  }
}

