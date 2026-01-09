import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// DELETE: Delete agenda item
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const pathnameParts = url.pathname.split("/");
    const agendaId = pathnameParts[pathnameParts.length - 1];

    await prisma.agendaItem.delete({
      where: { id: agendaId },
    });

    return NextResponse.json({ message: "Agenda item deleted successfully." });
  } catch (error) {
    console.error("[AGENDA_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete agenda item." }, { status: 500 });
  }
}

function normalizeTime(t: string) {
  // Accept "HH:mm" or "HH:mm:ss" — convert "HH:mm" -> "HH:mm:00"
  if (/^\d{1,2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}

export async function PUT(req: NextRequest) {
  try {
    const parts = req.nextUrl.pathname.split('/').filter(Boolean);
    // expected parts: ['api','events','<eventId>','agenda','<agendaId>']
    const eventId = parts[2];
    const agendaId = parts[4];

    if (!eventId || !agendaId) {
      return NextResponse.json({ error: 'Event ID or Agenda ID not found in URL' }, { status: 400 });
    }

    const body = await req.json();
    const { title, description, date, startTime, endTime, fullStartTime, fullEndTime } = body;

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

    let parsedStart: Date;
    let parsedEnd: Date;

    if (typeof fullStartTime === 'string' && typeof fullEndTime === 'string') {
      parsedStart = new Date(fullStartTime);
      parsedEnd = new Date(fullEndTime);
    } else {
      // Build full datetimes from date + time (e.g. "2025-08-21T20:26:00")
      const startIso = `${date}T${normalizeTime(startTime)}`;
      const endIso = `${date}T${normalizeTime(endTime)}`;
      parsedStart = new Date(startIso);
      parsedEnd = new Date(endIso);
    }

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time format provided' }, { status: 400 });
    }

    // If end is earlier than start, assume it rolls over to next day
    if (parsedEnd.getTime() < parsedStart.getTime()) {
      parsedEnd = new Date(parsedEnd.getTime() + 24 * 60 * 60 * 1000);
    }

    // verify the agenda item exists and belongs to this event (optional but safer)
    const existing = await prisma.agendaItem.findUnique({ where: { id: agendaId } });
    if (!existing) {
      return NextResponse.json({ error: 'Agenda item not found' }, { status: 404 });
    }
    if (existing.eventId !== eventId) {
      return NextResponse.json({ error: 'Agenda item does not belong to given event' }, { status: 403 });
    }

    // For `date` column keep a date-only value (midnight local)
    const parsedDate = new Date(date);

    const updated = await prisma.agendaItem.update({
      where: { id: agendaId },
      data: {
        title,
        description: description || null,
        date: parsedDate,
        startTime: parsedStart,
        endTime: parsedEnd,
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error('[AGENDA_PUT]', err);
    return NextResponse.json({ error: 'Failed to update agenda item' }, { status: 500 });
  }
}
