import { NextResponse, type NextRequest } from 'next/server';
import { sessionReader } from './lib/session';

export async function middleware(request: NextRequest) {
  if (await sessionReader(request)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname + request.nextUrl.search);
  const response = NextResponse.redirect(loginUrl);
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = {
  runtime: 'nodejs',
  matcher: ['/book/:path*', '/search/:path*'],
};
