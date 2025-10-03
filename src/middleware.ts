import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// PUBLIC (prefix) routes — adjust to your real login/register paths
const publicPrefixes = [
  '/api/company/login',
  '/api/auth/login',
  '/api/register',
  '/api/public',        // example: open APIs under /api/public
  '/company/login',
  '/company/register',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // let static/next assets through quickly (optional)
  if (pathname.startsWith('/_next/') || pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Let any public prefix pass through
  if (publicPrefixes.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Accept either: cookie token OR Authorization header
  const cookieToken = request.cookies.get('jwt_token')?.value ?? request.cookies.get('userId')?.value;
  const authHeader = request.headers.get('authorization');

  const hasAuth = !!cookieToken || (authHeader != null && authHeader.startsWith('Bearer '));

  if (!hasAuth) {
    // API request -> JSON 401
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Page request -> redirect to login
    const loginUrl = new URL('/company/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // token present — proceed (you can add token validation here if you want)
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
