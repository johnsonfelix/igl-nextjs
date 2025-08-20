import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // Log the DATABASE_URL to the serverless function's logs in CloudWatch
  console.log('DATABASE_URL at runtime:', process.env.DATABASE_URL);

  // Send the response back for direct viewing in the browser.
  // This is for debugging purposes only.
  // REMOVE OR COMMENT THIS OUT AFTER YOU'RE DONE DEBUGGING.
  return NextResponse.json({
    message: 'Environment variable check',
    databaseUrlIsSet: !!process.env.DATABASE_URL,
    databaseUrlValue: process.env.DATABASE_URL || 'Not Set' ,// Use for debugging only
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URLva: process.env.DATABASE_URL || 'Not Set', // Use for debugging only
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_URL_NON_POOLINGva: process.env.DATABASE_URL || 'Not Set' // Use for debugging only
  });
}
