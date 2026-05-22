import { NextRequest, NextResponse } from 'next/server';

import redirectsJson from './redirects.json';

type Redirect = {
  destination: string;
  permanent?: boolean;
};

// Convert redirects JSON to a Map for O(1) lookups
const redirects = new Map<string, Redirect>(Object.entries(redirectsJson));

// Strip a trailing slash so `/foo` and `/foo/` resolve to the same entry.
// `/` stays `/`.
const normalizePath = (pathname: string): string =>
  pathname.length > 1 && pathname.endsWith('/') ?
    pathname.slice(0, -1)
  : pathname;

export async function middleware(request: NextRequest) {
  const redirect = redirects.get(normalizePath(request.nextUrl.pathname));

  if (redirect) {
    const destination = request.nextUrl.clone();
    destination.pathname = redirect.destination;
    destination.search = request.nextUrl.search;
    const statusCode = redirect.permanent === false ? 307 : 301;
    return NextResponse.redirect(destination, statusCode);
  }

  return NextResponse.next();
}

export const config = {
  // Skip middleware on Next.js internals and the API routes — only run on
  // real page paths where legacy redirects might apply.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
