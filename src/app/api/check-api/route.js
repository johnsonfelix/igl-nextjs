export default function handler(req, res) {
  // Log the DATABASE_URL to the serverless function's logs
  console.log('DATABASE_URL at runtime:', process.env.DATABASE_URL);

  // Optionally, you can send it back in the response for direct viewing
  // Be careful with this and remove it after debugging
  res.status(200).json({
    message: 'Environment variable check',
    databaseUrlIsSet: !!process.env.DATABASE_URL,
    databaseUrlValue: process.env.DATABASE_URL || 'Not Set' ,// Use for debugging only
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    POSTGRES_URL: process.env.DATABASE_URL || 'Not Set', // Use for debugging only
    POSTGRES_URL_NON_POOLING: !!process.env.POSTGRES_URL_NON_POOLING,
    POSTGRES_URL_NON_POOLING: process.env.DATABASE_URL || 'Not Set' // Use for debugging only
  });
}
