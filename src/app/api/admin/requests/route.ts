import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const requests = await prisma.meetingRequest.findMany({
      include: {
        event: {
          select: { name: true }
        },
        fromCompany: {
          select: { name: true }
        },
        toCompany: {
          select: { name: true }
        },
        meetingSlot: {
          select: { startTime: true, endTime: true, title: true }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error("Failed to fetch meeting requests:", error);
    return NextResponse.json({ error: "Failed to fetch meeting requests" }, { status: 500 });
  }
}
