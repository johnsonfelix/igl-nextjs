import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";


const publicPrefixes = [
  
  "/company/login",
  "/company/register",
  "/register",
  "/company/forgot-password",
  "/company/reset-password",

  
  "/api/register",
  "/api/company/register",
  "/api/auth/register",
  "/api/company/login",
  "/api/company/login",
  "/api/auth/login",
  "/api/company/forgot-password",
  "/api/company/forgot-password",
  "/api/company/reset-password",
  "/api/auth/check-email", 

  
  "/api/public",
  "/api/upload-url",

  
  "/api/events",
  "/api/tickets",
  "/api/sponsors",
  "/api/companies", 
  "/api/admin/membership-plans", 
  "/api/admin/offers", 
  "/api/admin/booth-subtypes", 
  "/api/inquiries", 
  "/api/testimonials", 
  "/api/chat", 
  "/api/analytics/track", 

  
  "/membership",
  "/event",
  "/directory",
  "/inquiry",
  "/risk",
  "/about",
  "/company/details", 
  "/secure-pay",
  "/contact-us",
  "/api/company/inquiry",
  "/api/past-events",
  "/past-events",
  "/privacy-policy",
  "/cookies-policy",
];


function isStaticAsset(pathname: string) {
  return pathname.startsWith("/_next/") || pathname.startsWith("/static/") || pathname.startsWith("/images/") || pathname === "/favicon.ico";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  
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

  
  if (pathname.startsWith('/admin')) {
    try {
      
      const jwt = request.cookies.get('jwt_token')?.value;
      if (!jwt) throw new Error('No jwt token');

      const parts = jwt.split('.');
      if (parts.length !== 3) throw new Error('Invalid token format');

      
      let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      
      while (base64.length % 4) {
        base64 += '=';
      }

      const jsonPayload = atob(base64);
      const payload = JSON.parse(jsonPayload);

      if (payload.role !== 'ADMIN') {
        
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (e) {
      
      return NextResponse.redirect(new URL('/company/login', request.url));
    }
  }

  
  const res = NextResponse.next();
  res.headers.set('x-auth-cookie-present', cookieToken ? '1' : '0');
  res.headers.set('cache-control', 'no-store'); 
  return res;
}

export const config = {
  
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
