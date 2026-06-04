import { NextRequest, NextResponse } from 'next/server';

import redirectsJson from './redirects.json';

type Redirect = {
  destination: string;
  permanent?: boolean;
};

const redirects = new Map<string, Redirect>(Object.entries(redirectsJson));

const locales = ['de', 'fr'];

// Strip a leading locale segment (`/de/home` -> `/home`) so redirect rules can
// be written locale-agnostically, regardless of whether Next.js keeps the
// locale in the pathname or not.
const stripLocale = (pathname: string): string => {
  const [, first, ...rest] = pathname.split('/');
  return locales.includes(first) ? `/${rest.join('/')}` : pathname;
};

// Drop the trailing slash (except for the root path).
const normalizePath = (pathname: string): string =>
  pathname.length > 1 && pathname.endsWith('/') ?
    pathname.slice(0, -1)
  : pathname;

export async function middleware(request: NextRequest) {
  const path = normalizePath(stripLocale(request.nextUrl.pathname));
  const redirect = redirects.get(path);

  if (redirect) {
    const statusCode = redirect.permanent === false ? 307 : 301;
    const isExternal = /^https?:\/\//i.test(redirect.destination);

    if (isExternal) {
      return NextResponse.redirect(redirect.destination, statusCode);
    }

    const destination = request.nextUrl.clone();
    destination.pathname = redirect.destination;
    destination.search = request.nextUrl.search;
    return NextResponse.redirect(destination, statusCode);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
