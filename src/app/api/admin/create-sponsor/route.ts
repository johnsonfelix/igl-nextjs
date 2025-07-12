import { NextResponse } from "next/server";
import { createSponsor } from "@/app/lib/adminService";

export async function POST(req: Request) {
  const body = await req.json();
  const sponsor = await createSponsor(body);
  return NextResponse.json(sponsor);
}
