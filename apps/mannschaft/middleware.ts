import { NextRequest, NextResponse } from 'next/server';

import redirectsJson from './redirects.json';

// Convert redirects JSON to a Map for O(1) lookups
const redirects = new Map(Object.entries(redirectsJson));

type Redirect = {
  destination: string;
  permanent?: boolean;
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const redirect = redirects.get(pathname) as Redirect;

  if (redirect) {
    const statusCode = 301;
    const destination = request.nextUrl.clone();
    destination.href = destination.origin + redirect.destination;

    return NextResponse.redirect(destination, statusCode);
  }

  return NextResponse.next();
}
