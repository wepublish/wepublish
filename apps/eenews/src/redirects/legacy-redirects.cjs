// @ts-check
/**
 * Legacy ee-news.ch → new eenews redirects (pattern-based).
 *
 * Consumed by next.config.js `redirects()`. Article redirects are NOT here —
 * they key on a 39k legacy-id→slug map and live in `middleware.ts`.
 *
 * Covered here:
 *   - Theme / dossier / category listing pages → new tag pages `/a/tag/<tag>`
 *   - CMS pages `/cms/shortname/<slug>` → `/cms-page` (+ explicit overrides)
 *   - Agenda (events) `/agenda…` → `/event`
 *
 * The app has NO Next i18n — `/de/…` is a literal path segment and the new
 * site serves at root. So sources carry an explicit `/:lang(de|fr|en)/` prefix
 * and destinations have NO locale prefix. All redirects are permanent (301).
 *
 * NOTE (jobs/companies/links): intentionally NOT redirected — companies and
 * links become static single-page directories with client-side filtering, and
 * jobs are dropped.
 */

/**
 * Theme / dossier / category old slug → ACTUAL we.publish tag string.
 *
 * The tag string is the one the tag page resolves on (`/a/tag/<tag>`), taken
 * from the live API — NOT a slugified value. The destination URL-encodes it
 * (`mobilität` → `/a/tag/mobilit%C3%A4t`).
 *
 * Old listing-page URLs were flat: `/de/<slug>` and `/de/<slug>/page/<n>`.
 * (`the-smarter-e-…` maps to the curated short tag `the smarter e`.)
 * Tags marked “created on full import” don't exist until the full import runs
 * the articles that reference them; the redirect simply 404s until then.
 */
const TAXONOMY_TAG_BY_OLD_SLUG = {
  // themes
  biomasse: 'biomasse',
  erneuerbare: 'erneuerbare',
  medien: 'medien',
  publireportage: 'publireportage',
  solar: 'solar',
  wasser: 'wasser',
  wind: 'wind',
  wissenswertes: 'wissenswertes', // created on full import
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
  heizen: 'heizen', // created on full import
  heizloesung: 'heizlösung', // created on full import
  herstellung: 'herstellung', // created on full import
  international: 'international',
  kommentare: 'kommentare',
  lagerung: 'lagerung', // created on full import
  liefern: 'liefern', // created on full import
  politik: 'politik',
  presse: 'presse', // created on full import
  pressemeldungen: 'pressemeldungen',
  produzieren: 'produzieren', // created on full import
};

/**
 * CMS page slug → destination override. Anything NOT listed falls through to
 * the blanket `/cms-page`. `donation` is the only confirmed mapping so far.
 *
 * TODO(client): fill in per-page targets here (e.g. impressum, datenschutz,
 * firmenverzeichnis, jobabo, …). Until specified, they go to `/cms-page`.
 */
const CMS_OVERRIDES = {
  donation: '/mitmachen',
  // 'impressum': '/impressum',
  // 'datenschutzerklarung': '/datenschutz',
  // 'firmenverzeichnis': '/company',
  // 'jobabo': '/job',
  // 'stellenangebote-und-stellengesuche-inserieren': '/job',
};

const permanent = true;
// Old URLs always carry a literal language prefix, e.g. /de/…, /fr/…, /en/….
const LANG = '/:lang(de|fr|en)';

/** @returns {Array<{source:string,destination:string,permanent:boolean}>} */
function legacyRedirects() {
  /** @type {Array<{source:string,destination:string,permanent:boolean}>} */
  const out = [];

  // ── Taxonomy listing pages → tag pages ──────────────────────────────────
  for (const [oldSlug, tag] of Object.entries(TAXONOMY_TAG_BY_OLD_SLUG)) {
    const destination = `/a/tag/${encodeURIComponent(tag)}`;
    out.push({ source: `${LANG}/${oldSlug}`, destination, permanent });
    out.push({ source: `${LANG}/${oldSlug}/page/:n*`, destination, permanent });
  }

  // ── CMS pages → /cms-page (specific overrides first, then blanket) ───────
  for (const [slug, destination] of Object.entries(CMS_OVERRIDES)) {
    out.push({ source: `${LANG}/cms/shortname/${slug}`, destination, permanent });
  }
  out.push({ source: `${LANG}/cms/shortname/:slug*`, destination: '/cms-page', permanent });

  // ── Agenda (events) → /event (detail pages don't exist yet) ─────────────
  out.push({ source: `${LANG}/agenda`, destination: '/event', permanent });
  out.push({ source: `${LANG}/agenda/:path*`, destination: '/event', permanent });

  return out;
}

module.exports = { legacyRedirects, TAXONOMY_TAG_BY_OLD_SLUG, CMS_OVERRIDES };
