import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public API routes that should not be protected.
const publicApiRoutes = [
  '/api/company/login', 
  // Add other public API routes here if needed, e.g., '/api/register'
];

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('userId')?.value;
  const { pathname } = request.nextUrl;

  // --- THIS IS THE FIX ---
  // If the request is for a public API route, let it pass through immediately.
  if (publicApiRoutes.includes(pathname)) {
    return NextResponse.next();
  }
  // --- END OF FIX ---

  // If the user is not authenticated for any other route:
  if (!sessionToken) {
    // If it's an API request, return a JSON 401 error.
    if (pathname.startsWith('/api/')) {
      console.log('Blocking unauthenticated API request to:', pathname);
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // For any other page request, redirect to the login screen.
    const loginUrl = new URL('/company/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // If the user has a session token, allow them to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /company/login (the login page itself)
     */
    '/((?!_next/static|_next/image|favicon.ico|company/login).*)',
  ],
};
