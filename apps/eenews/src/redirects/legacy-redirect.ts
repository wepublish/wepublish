/**
 * Legacy ee-news.ch → eenews redirects, in one place.
 *
 * Next split these in two: article redirects keyed on a 39k legacy-id → slug
 * map lived in `proxy.ts` (a Next middleware), the pattern-based ones in
 * `next.config.js#redirects()` via `legacy-redirects.cjs`. TanStack Start has
 * neither hook, so both run from the request middleware in `src/start.ts`,
 * which gives them one evaluation order: articles first, patterns second —
 * the order Next produced, since the middleware ran before `redirects()`.
 *
 * Old URLs always carry a literal `/de|/fr|/en` prefix: the app never had Next
 * i18n routing and the new site serves at root, so no destination is prefixed.
 * Everything here answers 301.
 */

/**
 * Theme / dossier / category old slug → the actual we.publish tag string the
 * tag page resolves on. Not slugified: `mobilität` is the tag, and the
 * destination URL-encodes it.
 */
export const TAXONOMY_TAG_BY_OLD_SLUG: Record<string, string> = {
  // themes
  biomasse: 'biomasse',
  erneuerbare: 'erneuerbare',
  medien: 'medien',
  publireportage: 'publireportage',
  solar: 'solar',
  wasser: 'wasser',
  wind: 'wind',
  wissenswertes: 'wissenswertes',
  // dossiers
  aeesuisse: 'aeesuisse',
  'akw-debatte': 'akw-debatte',
  'articles-en-francais': 'articles en français',
  batterien: 'batterien',
  bauen: 'bauen',
  buecher: 'bücher',
  'energiestrategie-2050': 'energiestrategie 2050',
  'fossile-energien': 'fossile energien',
  klima: 'klima',
  mobilitaet: 'mobilität',
  'the-smarter-e-intersolar-europe-power2drive-ees-em-power': 'the smarter e',
  // categories
  fachartikel: 'fachartikel',
  forschung: 'forschung',
  heizen: 'heizen',
  heizloesung: 'heizlösung',
  herstellung: 'herstellung',
  international: 'international',
  kommentare: 'kommentare',
  lagerung: 'lagerung',
  liefern: 'liefern',
  politik: 'politik',
  presse: 'presse',
  pressemeldungen: 'pressemeldungen',
  produzieren: 'produzieren',
};

/**
 * CMS page slug → destination override. Anything not listed falls through to
 * the blanket `/cms-page`.
 */
export const CMS_OVERRIDES: Record<string, string> = {
  donation: '/mitmachen',
};

const LOCALES = new Set(['de', 'fr', 'en']);

/** `article/<id>` anywhere in the path, optional trailing slug segment. */
const ARTICLE_RE = /(?:^|\/)article\/(\d+)(?:\/([^/?#&]+))?/;

const stripLocale = (pathname: string) => {
  const segments = pathname.split('/').filter(Boolean);
  const lang = LOCALES.has(segments[0]) ? segments[0] : undefined;

  return { lang, rest: lang ? segments.slice(1) : segments };
};

/**
 * The destination for one legacy pathname, or `null` when it is not a legacy
 * URL. Pure, so the whole table is exercised by the spec rather than by
 * booting a server.
 */
export const resolveLegacyRedirect = (
  pathname: string,
  byId: Record<string, string>
): string | null => {
  const { lang, rest } = stripLocale(pathname);

  const article = pathname.match(ARTICLE_RE);

  if (article) {
    const [, id, urlSlug] = article;
    const slug = byId[`${lang ?? 'de'}/${id}`] ?? byId[id] ?? urlSlug;

    return slug ? `/a/${slug}` : null;
  }

  // `next.config.js` sent both of these home; neither page exists.
  if (!lang && (rest[0] === 'event' || rest[0] === 'events') && !rest[1]) {
    return '/';
  }

  // Everything below is a legacy URL only with its locale prefix.
  if (!lang) {
    return null;
  }

  if (!rest.length) {
    return '/';
  }

  if (rest[0] === 'agenda') {
    return '/event';
  }

  if (rest[0] === 'cms' && rest[1] === 'shortname' && rest[2]) {
    return CMS_OVERRIDES[rest[2]] ?? '/cms-page';
  }

  // `/<slug>` and `/<slug>/page/<n>` both land on the tag page.
  const tag = TAXONOMY_TAG_BY_OLD_SLUG[rest[0]];

  if (tag && (rest.length === 1 || rest[1] === 'page')) {
    return `/a/tag/${encodeURIComponent(tag)}`;
  }

  return null;
};
