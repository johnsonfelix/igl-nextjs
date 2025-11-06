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
];

/**
 * Allow static assets through quickly
 */
function isStaticAsset(pathname: string) {
  return pathname.startsWith("/_next/") || pathname.startsWith("/static/") || pathname === "/favicon.ico";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // static assets and favicon
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  // allow CORS preflight
  if (request.method === "OPTIONS") {
    return NextResponse.next();
  }

  // Allow any public prefix to pass through (registration, login, presign, public APIs)
  if (publicPrefixes.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Accept either: cookie token OR Authorization header
  const cookieToken =
    request.cookies.get("jwt_token")?.value ?? request.cookies.get("userId")?.value;
  const authHeader = request.headers.get("authorization");

  const hasAuth = !!cookieToken || (authHeader != null && authHeader.startsWith("Bearer "));

  if (!hasAuth) {
    // API request -> JSON 401
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ message: "Authentication required" }, { status: 401 });
    }

    // Page request -> redirect to login
    const loginUrl = new URL("/company/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // token present — proceed
  return NextResponse.next();
}

export const config = {
  // run middleware for everything except certain static folders (adjust if needed)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
