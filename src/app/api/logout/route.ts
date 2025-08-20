// app/api/logout/route.ts
import { NextResponse } from "next/server";

export async function POST() {
  // Remove userId cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set("userId", "", { path: "/", maxAge: 0 });
  return response;
}
