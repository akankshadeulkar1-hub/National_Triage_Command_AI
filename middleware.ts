import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Role-Based Access Control (RBAC).
 * Intercepts requests to /command-center and verifies JWT token & role claims.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/command-center')) {
    const userRoleCookie = request.cookies.get('user_role')?.value || '';
    const userTokenCookie = request.cookies.get('user_token')?.value || '';

    let role = userRoleCookie;

    // Decode JWT payload if cookie is present
    if (!role && userTokenCookie) {
      try {
        const parts = userTokenCookie.split('.');
        if (parts.length === 3) {
          const base64Url = parts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const payload = JSON.parse(jsonPayload);
          role = payload.role || '';
        }
      } catch (e) {
        console.warn('Middleware JWT decode note:', e);
      }
    }

    const normalizedRole = role.toUpperCase();

    // Redirect PARAMEDIC role away from Command Center to /unauthorized or /field-dispatch
    if (normalizedRole.includes('PARAMEDIC')) {
      const url = request.nextUrl.clone();
      url.pathname = '/unauthorized';
      return NextResponse.redirect(url);
    }

    // Redirect unauthenticated users if auth requirement is active
    if (!normalizedRole.includes('ADMIN') && request.cookies.get('strict_auth')?.value === 'true') {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/command-center/:path*'],
};
