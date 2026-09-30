
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<Record<string, string | string[]>> }
) {
  
  const rawParams = await ctx.params;

  
  const normalize = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  
  let companyId = normalize(rawParams.companyId) ?? normalize(rawParams.id);

  
  if (!companyId) {
    const parts = request.nextUrl.pathname.split("/").filter(Boolean);
    const idx = parts.findIndex((p) => p === "companies");
    if (idx >= 0 && parts.length > idx + 1) companyId = parts[idx + 1];
  }

  if (!companyId) {
    return NextResponse.json(
      {
        error:
          "Missing or invalid company id in route. Call /api/admin/companies/<id>/verify",
      },
      { status: 400 }
    );
  }

  
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const existing = await prisma.company.findUnique({ where: { id: companyId } });
    if (!existing) {
      return NextResponse.json(
        { error: `Company not found for id: ${companyId}` },
        { status: 404 }
      );
    }

    const hasIsVerified = Object.prototype.hasOwnProperty.call(body, "isVerified");
    let newValue: boolean;

    if (hasIsVerified) {
      if (typeof body.isVerified !== "boolean") {
        return NextResponse.json(
          { error: "isVerified must be boolean" },
          { status: 400 }
        );
      }
      newValue = body.isVerified;
    } else {
      newValue = !existing.isVerified;
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { isVerified: newValue },
      include: { location: true, media: true },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
