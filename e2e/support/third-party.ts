/**
 * Third-party hosts the website talks to that a test never needs: analytics,
 * ads, error reporting and tracking pixels. Blocking them makes runs faster and
 * less flaky, and keeps synthetic traffic out of the tenants' statistics.
 * Turnstile (challenges.cloudflare.com) must stay reachable for captchas.
 *
 * Blocked at DNS level (Chromium `--host-resolver-rules`) rather than with
 * `context.route`: routing makes Chromium pause and forward every request,
 * which stalled media-heavy tenant pages until the `load` event timed out.
 */
const blockedDomains = [
  'google-analytics.com',
  'analytics.google.com',
  'googletagmanager.com',
  'googlesyndication.com',
  'doubleclick.net',
  'googleadservices.com',
  'sentry.io',
  'prolitteris.ch',
  'wemf.ch',
  'ioam.de',
  'facebook.net',
  'connect.facebook.com',
  'hotjar.com',
  'hotjar.io',
  'plausible.io',
  'matomo.cloud',
];

/** Chromium launch arg that makes the domains (and subdomains) unresolvable. */
export const blockThirdPartiesArg = `--host-resolver-rules=${blockedDomains
  .flatMap(domain => [`MAP ${domain} ~NOTFOUND`, `MAP *.${domain} ~NOTFOUND`])
  .join(', ')}`;
