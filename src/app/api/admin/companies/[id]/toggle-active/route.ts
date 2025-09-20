// app/api/admin/companies/[companyId]/toggle-active/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;

  if (!companyId) {
    return NextResponse.json(
      { error: "Missing or invalid company id" },
      { status: 400 }
    );
  }

  // Safe parse body (body is optional)
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const existing = await prisma.company.findUnique({ where: { id: companyId } });
    if (!existing) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const hasIsActive = Object.prototype.hasOwnProperty.call(body, "isActive");
    let newValue: boolean;

    if (hasIsActive) {
      if (typeof body.isActive !== "boolean") {
        return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });
      }
      newValue = body.isActive;
    } else {
      newValue = !existing.isActive;
    }

    const updated = await prisma.company.update({
      where: { id: companyId },
      data: { isActive: newValue },
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
