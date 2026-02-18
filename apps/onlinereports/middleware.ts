import { NextRequest, NextResponse } from 'next/server';

import { redirectMap } from './redirectMap';

function normalizePath(pathname: string): string {
  const segments = pathname.split('/');
  const stack: string[] = [];

  for (const segment of segments) {
    if (!segment || segment === '.') continue;
    if (segment === '..') {
      stack.pop();
    } else {
      stack.push(segment);
    }
  }

  return '/' + stack.join('/');
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Normalize path to prevent traversal attacks like "/../" or "//"
  const normalizedPath = normalizePath(pathname);

  // Reject if normalization changed the path (means suspicious input)
  if (normalizedPath !== pathname) {
    console.warn(
      `Path normalization changed path: ${pathname} -> ${normalizedPath}`
    );
    return NextResponse.next();
  }

  // Validate pathname to prevent SSRF attacks
  const pathValidation = /^\/[a-zA-Z0-9\-_/.+]+\.html$/;
  if (!pathValidation.test(pathname)) {
    console.warn(`Invalid pathname pattern: ${pathname}`);
    return NextResponse.next();
  }

  const htmlFile = pathname.substring(1); // Remove leading slash

  if (redirectMap.has(htmlFile)) {
    const newPath = `/${redirectMap.get(htmlFile)}`;
    return NextResponse.redirect(new URL(newPath, request.url), 301);
  }

  const externalHostname = 'https://archiv2.onlinereports.ch';
  const externalUrl = `${externalHostname}${pathname}`;
  try {
    const response = await fetch(externalUrl);

    if (response.status === 404) {
      return NextResponse.next();
    }

    const html = await response.text();
    const homepageTitle =
      '<title>ONLINEREPORTS | News, Stories, Reportagen aus Basel, Nordwestschweiz</title>';
    const isHomepage = html.includes(homepageTitle);

    if (!isHomepage) {
      return NextResponse.redirect(externalUrl, 302);
    }
  } catch (error) {
    console.warn(`Error checking ${externalUrl} :`, error);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/(.*html)'],
};
