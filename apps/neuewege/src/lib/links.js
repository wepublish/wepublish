// Rewrites links to legacy paths that moved; the redirect table lives in
// links.cjs so next.config.js can share it.
import targets from './links.cjs';

const { REDIRECTS } = targets;

const LEGACY_ORIGINS = [
  'https://neuewege.ch',
  'https://www.neuewege.ch',
  'http://neuewege.ch',
  'http://www.neuewege.ch',
];

function normalizePath(href) {
  const origin = LEGACY_ORIGINS.find(o => href.startsWith(o));
  const path = origin ? href.slice(origin.length) || '/' : href;

  return path.length > 1 ? path.replace(/\/$/, '') : path;
}

// "/<slug>" as a path on this site. The slug comes from the URL
// (router.query) or from CMS data, so it must not be able to leave the site:
// a leading "//" or "\" (browsers read "/\" as "//") would make the link
// protocol-relative (e.g. "//evil.com"), and URL parsing drops tabs and
// newlines anywhere ("/\t/evil.com"). Everything else is kept as is: legacy
// slugs contain dots and percent-encoded umlauts.
export function localPath(slug) {
  const path = String(slug ?? '')
    .replace(/[\t\n\r]/g, '')
    .replace(/^[/\\]+/, '');

  return `/${path}`;
}

// the new target of a moved legacy path, or undefined if it stays as it is
export function externalTarget(href) {
  if (!href) {
    return undefined;
  }

  return REDIRECTS[normalizePath(href)];
}

// rewrites href="..." attributes in CMS-provided HTML (popups, text paragraphs)
export function rewriteLegacyLinks(html) {
  if (!html) {
    return html;
  }

  return html.replace(/href="([^"]*)"/g, (match, href) => {
    const target = externalTarget(href);

    return target ? `href="${target}"` : match;
  });
}
