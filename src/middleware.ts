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
  "/company/forgot-password",
  "/company/reset-password",

  // backend API registration/auth endpoints
  "/api/register",
  "/api/company/register",
  "/api/auth/register",
  "/api/company/login",
  "/api/company/login",
  "/api/auth/login",
  "/api/company/forgot-password",
  "/api/company/reset-password",

  // open/public APIs & upload presign endpoint used by the app
  "/api/public",
  "/api/upload-url",

  // Public Data APIs (for public pages)
  "/api/events",
  "/api/tickets",
  "/api/sponsors",
  "/api/companies", // e.g. directory search
  "/api/admin/membership-plans", // for membership page
  "/api/admin/offers", // for event discounts
  "/api/admin/booth-subtypes", // public booth options
  "/api/inquiries", // for submitting and viewing inquiries
  "/api/testimonials", // public testimonials

  // Public pages
  "/membership",
  "/event",
  "/directory",
  "/inquiry",
  "/risk",
  "/about",
  "/company/details", // Public profile view
  "/secure-pay",
  "/contact-us",
  "/api/company/inquiry",
];

/**
 * Allow static assets through quickly
 */
function isStaticAsset(pathname: string) {
  return pathname.startsWith("/_next/") || pathname.startsWith("/static/") || pathname.startsWith("/images/") || pathname === "/favicon.ico";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Exact match for home page
  if (pathname === "/") return NextResponse.next();

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

  // --- ADMIN PROTECTION ---
  if (pathname.startsWith('/admin')) {
    try {
      // Must have JWT for admin access
      const jwt = request.cookies.get('jwt_token')?.value;
      if (!jwt) throw new Error('No jwt token');

      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');

      // Base64Url decode implementation
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // Add padding if needed
      while (base64.length % 4) {
        base64 += '=';
      }

      const jsonPayload = atob(base64);
      const payload = JSON.parse(jsonPayload);

      if (payload.role !== 'ADMIN') {
        // Redirect non-admins to home or dashboard
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      // If token invalid, missing, or check fails, redirect
      return NextResponse.redirect(new URL('/company/login', request.url));
    }
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
