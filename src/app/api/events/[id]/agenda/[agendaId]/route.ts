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
