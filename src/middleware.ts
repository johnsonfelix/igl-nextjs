// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Public (no-auth) route prefixes.
 * Update this list if you add more public endpoints.
 */
const publicPrefixes = [
  // auth / register pages (frontend)
  "/company/login",
  "/company/register",
  "/register",

  // backend API registration/auth endpoints
  "/api/register",
  "/api/company/register",
  "/api/auth/register",
  "/api/company/login",
  "/api/auth/login",

  // open/public APIs & upload presign endpoint used by the app
  "/api/public",
  "/api/upload-url",
  "/", // Home page
];

/**
 * Allow static assets through quickly
 */
function isStaticAsset(pathname: string) {
  return pathname.startsWith("/_next/") || pathname.startsWith("/static/") || pathname === "/favicon.ico";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isStaticAsset(pathname) || request.method === 'OPTIONS') return NextResponse.next();
  if (publicPrefixes.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const cookieToken =
    request.cookies.get('jwt_token')?.value ?? request.cookies.get('userId')?.value;
  const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ') ?? false;
  const hasAuth = Boolean(cookieToken || hasAuthHeader);

  if (!hasAuth) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    const loginUrl = new URL('/company/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // add debug header so you can see what the edge read
  const res = NextResponse.next();
  res.headers.set('x-auth-cookie-present', cookieToken ? '1' : '0');
  res.headers.set('cache-control', 'no-store'); // avoid any accidental edge caching
  return res;
}


export const config = {
  // run middleware for everything except certain static folders (adjust if needed)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
