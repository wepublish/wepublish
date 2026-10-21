import { resolveTarget } from './targets';

/**
 * Everything the suite knows about its target comes from env vars: the
 * target (app + environment → URLs, see targets.ts) plus capabilities.
 * Scenarios declare what they need with tags, and the `capabilities` fixture
 * skips them (with the reason) when it is not available. See e2e/README.md.
 */

export const target = resolveTarget();

export const env = {
  apiUrl: target.apiUrl,
  apiToken: process.env.E2E_API_TOKEN || undefined,
  // Defaults to the seed admin, which only exists on local stacks.
  adminEmail: process.env.E2E_ADMIN_EMAIL || 'dev@wepublish.ch',
  adminPassword: process.env.E2E_ADMIN_PASSWORD || '123',
  /** On outside production (which is never written to); `false` opts out. */
  allowMutation: process.env.E2E_ALLOW_MUTATION !== 'false',
  mailpitUrl: process.env.MAILPIT_URL?.replace(/\/+$/, '') || undefined,
};

const isProduction = target.environment === 'production';

/** Tags that gate a scenario on the target and env configuration. */
const requirements: Record<string, () => string | undefined> = {
  '@mutating': () =>
    isProduction ? 'never writes to production'
    : !env.apiUrl ? 'needs E2E_API_URL'
    : !env.allowMutation ? 'disabled by E2E_ALLOW_MUTATION=false'
    : undefined,
  // The SIMULATED payment provider only exists outside production.
  '@payment': () =>
    isProduction ? 'no simulated payments in production'
    : !env.apiUrl ? 'needs E2E_API_URL'
    : undefined,
  '@mail': () => (!env.mailpitUrl ? 'needs MAILPIT_URL' : undefined),
};

/**
 * Reasons why a scenario with these tags cannot run here; empty if it can.
 * `@app:<name>` pins a scenario to tenants: it runs only when E2E_APP is one
 * of them.
 */
export function missingCapabilities(tags: string[]): string[] {
  const reasons = tags
    .map(tag => requirements[tag]?.())
    .filter((reason): reason is string => !!reason);

  const apps = tags
    .filter(tag => tag.startsWith('@app:'))
    .map(tag => tag.slice('@app:'.length));

  if (apps.length && !apps.includes(target.app)) {
    reasons.push(`only for ${apps.join(', ')} (E2E_APP is ${target.app})`);
  }

  return [...new Set(reasons)];
}
