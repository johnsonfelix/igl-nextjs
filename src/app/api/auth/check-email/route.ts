import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => null);
        if (!body || !body.email) {
            return NextResponse.json({ error: "Email is required in JSON body" }, { status: 400 });
        }

        const email = body.email;
        console.log(`[API check-email] Checking: "${email}"`);

        const user = await prisma.user.findFirst({
            where: { email: { equals: email.toString().trim(), mode: "insensitive" } },
            select: { id: true, email: true }
        });

        console.log(`[API check-email] Result for ${email}:`, user ? "FOUND" : "NOT_FOUND");

        return NextResponse.json({ exists: !!user });
    } catch (error: any) {
        console.error("[API check-email] Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
