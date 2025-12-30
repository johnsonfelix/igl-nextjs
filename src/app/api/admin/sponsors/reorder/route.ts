import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // In a transaction, update all items
        await prisma.$transaction(
            items.map((item: { id: string; sortOrder: number }) =>
                prisma.sponsorType.update({
                    where: { id: item.id },
                    data: { sortOrder: item.sortOrder },
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error reordering sponsors:", error);
        return NextResponse.json(
            { error: "Failed to reorder sponsors" },
            { status: 500 }
        );
    }
}
