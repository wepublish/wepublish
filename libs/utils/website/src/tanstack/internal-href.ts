const NON_HTTP_SCHEME = /^(mailto:|tel:|sms:)/i;
const ABSOLUTE = /^([a-z][a-z0-9+.-]*:)?\/\//i;

/**
 * The path TanStack's router should navigate to, or `null` when the href has
 * to stay a plain anchor.
 *
 * `next/link` handed an absolute URL on the site's own origin to the client
 * router; treating every absolute URL as external — which the first port did
 * — turns those into full document loads. The CMS entity URLs are already
 * relative by the time they reach a link (`absoluteUrlToRelative` rewrites
 * them as they are written into the Apollo cache), but anything an editor
 * typed by hand is not: the Gruppetto navigation carries
 * `https://gruppetto-magazin.ch/mitmachen`, which on the production domain is
 * the site itself.
 *
 * `siteUrl` must be a value both environments agree on, or the server and the
 * browser render different `href` attributes and hydration patches them. It
 * comes from `process.env.WEBSITE_URL`, which on the server is the real
 * environment and in the browser is the same string, inlined into
 * `window.PUBLIC_ENV` by the root shell. Unset, every absolute URL stays
 * external, which is what this did before.
 *
 * The scheme is deliberately not compared. A link typed as `http://` to a site
 * that is served over https is the same site, and the redirect it would
 * otherwise cost is a full page load.
 */
export const toInternalHref = (
  href: string | undefined,
  siteUrl: string | undefined
): string | null => {
  if (!href || href.startsWith('#') || NON_HTTP_SCHEME.test(href)) {
    return null;
  }

  if (!ABSOLUTE.test(href)) {
    return href;
  }

  if (!siteUrl) {
    return null;
  }

  try {
    const site = new URL(siteUrl);
    // A protocol-relative href has no scheme of its own; resolving it against
    // the site URL gives it one without changing the host it points at.
    const target = new URL(href, site);

    return target.host === site.host ?
        `${target.pathname}${target.search}${target.hash}`
      : null;
  } catch {
    return null;
  }
};
