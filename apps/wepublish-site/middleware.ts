import { NextRequest, NextResponse } from 'next/server';

import redirectsJson from './redirects.json';

type Redirect = {
  destination: string;
  permanent?: boolean;
};

const redirects = new Map<string, Redirect>(Object.entries(redirectsJson));

const locales = ['de', 'fr'];

const stripLocale = (pathname: string): string => {
  const [, first, ...rest] = pathname.split('/');
  return locales.includes(first) ? `/${rest.join('/')}` : pathname;
};

const normalizePath = (pathname: string): string =>
  pathname.length > 1 && pathname.endsWith('/') ?
    pathname.slice(0, -1)
  : pathname;

const isDocumentRequest = (request: NextRequest): boolean =>
  request.headers.get('sec-fetch-dest') === 'document' ||
  (request.headers.get('accept') ?? '').includes('text/html');

export async function middleware(request: NextRequest) {
  const { pathname, locale } = request.nextUrl;

  if (isDocumentRequest(request) && !locales.includes(locale ?? '')) {
    return NextResponse.redirect(
      new URL(`/de${pathname === '/' ? '' : pathname}`, request.url)
    );
  }

  const path = normalizePath(stripLocale(pathname));
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
  matcher: ['/', '/((?!api|_next|favicon.ico|deployed_version|.*\\..*).*)'],
};
