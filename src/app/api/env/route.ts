import { NextResponse } from 'next/server';


export const runtime = 'nodejs';

export async function GET() {
  const keys = ['POSTGRES_URL','POSTGRES_URL_NON_POOLING','JWT_SECRET','DATABASE_URL','NEXT_PUBLIC_ACCESS_KEY_ID','NEXT_PUBLIC_SECRET_ACCESS_KEY'];
  const result: Record<string, boolean> = {};
  for (const k of keys) result[k] = Boolean(process.env[k]);

  return NextResponse.json({
    ok: true,
    envPresent: result,
    
    runtime,
  });
}
