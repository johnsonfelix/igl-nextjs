
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export async function GET() {
    try {
        // efficient way to find max sequence?
        // aggregate is best
        const result = await prisma.manualInvoice.aggregate({
            _max: {
                sequence: true
            }
        });

        const nextSeq = (result._max.sequence || 0) + 1;
        const invoiceNumber = `IGLA${10000 + nextSeq}`;

        return NextResponse.json({ nextSeq, invoiceNumber });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch next sequence" }, { status: 500 });
    }
}
