import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/app/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // ✅ await is required in Next.js 15+
    const cookieStore = await cookies();
    const userId = cookieStore.get("userId")?.value;

    const headers = {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      Vary: "Cookie",
    } as const;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404, headers });

    const company = await prisma.company.findFirst({ where: { userId: user.id } });

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        companyId: company?.id ?? null,
      },
      { headers }
    );
  } catch (err) {
    console.error("API /me error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
          Vary: "Cookie",
        },
      }
    );
  }
}
