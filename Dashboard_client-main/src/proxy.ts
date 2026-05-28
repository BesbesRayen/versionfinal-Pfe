import { NextResponse, type NextRequest } from 'next/server';

const NO_STORE_PATHS = ['/admin', '/dashboard', '/login'];

export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const shouldDisableCache = NO_STORE_PATHS.some((path) => (
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
  ));

  if (shouldDisableCache) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/login'],
};
