import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  
  console.log('DATABASE_URL at runtime:', process.env.DATABASE_URL);

  
  
  
  return NextResponse.json({
    message: 'Environment variable check',
    databaseUrlIsSet: !!process.env.DATABASE_URL,
    databaseUrlValue: process.env.DATABASE_URL || 'Not Set' ,
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URLva: process.env.DATABASE_URL || 'Not Set', 
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_URL_NON_POOLINGva: process.env.DATABASE_URL || 'Not Set' ,
    JWT_SECRET: process.env.JWT_SECRET || 'Not Set' 
  });
}
