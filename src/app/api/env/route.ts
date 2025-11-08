import { NextResponse } from 'next/server';

// Ensure Node runtime for access to process.env (NOT 'edge')
export const runtime = 'nodejs';

export async function GET() {
  const keys = ['POSTGRES_URL','POSTGRES_URL_NON_POOLING','JWT_SECRET','DATABASE_URL','NEXT_PUBLIC_ACCESS_KEY_ID','NEXT_PUBLIC_SECRET_ACCESS_KEY'];
  const result: Record<string, boolean> = {};
  for (const k of keys) result[k] = Boolean(process.env[k]);

  return NextResponse.json({
    ok: true,
    envPresent: result,
    // Optional: show the runtime so you know you’re not on edge
    runtime,
  });
}
