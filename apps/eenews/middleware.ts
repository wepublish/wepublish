import { NextRequest, NextResponse } from 'next/server';

import articleRedirects from './src/redirects/article-redirects.generated.json';

/**
 * Legacy ee-news.ch ARTICLE redirects.
 *
 * Old article URLs all key on the stable legacy numeric `article.id` (the slug
 * in the URL is unreliable — thousands have no slug, ~600 ids get a `-<lang>`
 * suffix on import). Shapes handled (locale prefix already stripped by Next):
 *   /article/<id>
 *   /article/<id>/<slug>            (+ &page=…#anchor — query/hash ignored)
 *   /<theme>/article/<id>[/<slug>]
 *
 * `byId` keys are `"<id>"`; the 32 ids that exist in both de+fr are keyed
 * `"<lang>/<id>"`. We derive the lang from the old URL's `/de|fr|en/` prefix
 * and try `"<lang>/<id>"` first, then `"<id>"`. If an id isn't in the map but
 * the URL carries a slug, we fall back to `/a/<slug>` (correct for the 98.5%
 * where old slug == new slug).
 *
 * The app has NO Next i18n locale routing — `/de/…` is a literal path and the
 * new site serves at root — so the destination is always `/a/<slug>` with no
 * locale prefix (a `/fr/a/…` destination would 404).
 *
 * Taxonomy / CMS / agenda redirects are pattern-based and live in
 * next.config.js (`legacyRedirects()`), which runs after this middleware.
 */

const byId = (articleRedirects as { byId: Record<string, string> }).byId;

// `article/<id>` anywhere in the path, optional trailing slug segment.
const ARTICLE_RE = /(?:^|\/)article\/(\d+)(?:\/([^/?#&]+))?/;

const LOCALES = new Set(['de', 'fr', 'en']);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast path: only article URLs are handled here.
  if (!pathname.includes('/article/')) {
    return NextResponse.next();
  }

  const match = pathname.match(ARTICLE_RE);
  if (!match) {
    return NextResponse.next();
  }

  const id = match[1];
  const urlSlug = match[2];

  // Old URLs carry a literal `/de|fr|en/` prefix — use it only to disambiguate
  // the 32 ids that exist in both languages.
  const firstSeg = pathname.split('/').filter(Boolean)[0];
  const lang = LOCALES.has(firstSeg) ? firstSeg : 'de';

  const newSlug = byId[`${lang}/${id}`] ?? byId[id] ?? urlSlug;
  if (!newSlug) {
    return NextResponse.next();
  }

  // No locale prefix on the destination — the app serves at root.
  const url = request.nextUrl.clone();
  url.pathname = `/a/${newSlug}`;
  url.search = '';
  return NextResponse.redirect(url, 301);
}

export const config = {
  // Run on page requests only — skip Next internals, API and static assets.
  matcher: [
    '/((?!_next/static|_next/image|_next/data|favicon.ico|assets/|api/).*)',
  ],
};
