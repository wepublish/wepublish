import { NextRequest, NextResponse } from 'next/server';

const locales = ['de', 'fr'];

const isDocumentRequest = (request: NextRequest): boolean =>
  request.headers.get('sec-fetch-dest') === 'document' ||
  (request.headers.get('accept') ?? '').includes('text/html');

export function proxy(request: NextRequest) {
  const { pathname, locale } = request.nextUrl;

  if (isDocumentRequest(request) && !locales.includes(locale ?? '')) {
    return NextResponse.redirect(
      new URL(`/de${pathname === '/' ? '' : pathname}`, request.url)
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/((?!api|_next|favicon.ico|deployed_version|.*\\..*).*)'],
};
