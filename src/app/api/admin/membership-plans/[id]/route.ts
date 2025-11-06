// app/api/membership-plans/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/app/lib/prisma';
import { deleteS3Object } from '@/app/lib/s3';

// GET a single membership plan by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const plan = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!plan) {
      return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ message: 'Failed to fetch plan' }, { status: 500 });
  }
}

// PATCH (update) a membership plan by ID
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const data = await request.json();
    const { name, slug, price, features,description, thumbnail, } = data;

    const updatedPlan = await prisma.membershipPlan.update({
      where: { id },
      data: { name, slug, price,description, thumbnail, features },
    });

    return NextResponse.json(updatedPlan);
  } catch (error) {
    console.error('Error updating plan:', error);
    return NextResponse.json({ message: 'Failed to update plan' }, { status: 500 });
  }
}

// DELETE a membership plan by ID
function extractIdFromReq(req: NextRequest) {
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1];
}

// DELETE membership plan
export async function DELETE(req: NextRequest) {
  try {
    const id = extractIdFromReq(req);

    // 1) Load the plan so we know what to delete on S3
    const existing = await prisma.membershipPlan.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // 2) Prefer thumbnailKey; fallback to thumbnail URL if needed
    const keyOrUrl = (existing as any).thumbnailKey ?? existing.thumbnail ?? null;

    if (keyOrUrl) {
      try {
        const res = await deleteS3Object(keyOrUrl);
        console.info("[PLAN_DELETE] deleteS3Object:", res);
      } catch (err) {
        console.warn("[PLAN_DELETE] failed to delete S3 object:", err);
        // continue — DB deletion should still succeed
      }
    }

    // 3) Delete DB row
    await prisma.membershipPlan.delete({ where: { id } });

    return NextResponse.json({ message: "Plan deleted successfully" });
  } catch (error) {
    console.error("[PLAN_DELETE]", error);
    return NextResponse.json({ error: "Failed to delete plan" }, { status: 500 });
  }
}
