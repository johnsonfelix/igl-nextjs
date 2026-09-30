import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";


export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.pathname.split("/")[3]; 

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
  
  if (/^\d{1,2}:\d{2}$/.test(t)) return `${t}:00`;
  return t;
}


export async function POST(req: NextRequest) {
  try {
    const eventId = req.nextUrl.pathname.split('/')[3];
    if (!eventId) {
      return NextResponse.json({ error: 'Event ID not found in URL' }, { status: 400 });
    }

    const body = await req.json();
    console.log('Request body:', body);

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
      
      
      const startIso = `${date}T${normalizeTime(startTime)}`;
      const endIso = `${date}T${normalizeTime(endTime)}`;
      parsedStart = new Date(startIso);
      parsedEnd = new Date(endIso);
    }

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return NextResponse.json({ error: 'Invalid date/time format provided' }, { status: 400 });
    }

    
    
    const parsedDate = new Date(date); 

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

