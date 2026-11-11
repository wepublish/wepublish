import { BexioConfig } from './bexio';
import { ImapConfig, mailBackend } from './inbox';
import { ResendConfig } from './resend-inbox';
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
  /** A real mailbox the target's mail provider delivers to (Ethereal on review). */
  imap:
    process.env.E2E_IMAP_USER && process.env.E2E_IMAP_PASSWORD ?
      ({
        host: process.env.E2E_IMAP_HOST || 'imap.ethereal.email',
        port: Number(process.env.E2E_IMAP_PORT || 993),
        user: process.env.E2E_IMAP_USER,
        password: process.env.E2E_IMAP_PASSWORD,
      } satisfies ImapConfig)
    : undefined,
  /** Deletes older mails from the shared IMAP mailbox once per worker; off by default. */
  imapPurgeOlderThanDays:
    Number(process.env.E2E_IMAP_PURGE_OLDER_THAN_DAYS) || undefined,
  /** Resend receiving domain: mail from outside servers (bexio's invoice mails). */
  resend:
    process.env.E2E_RESEND_API_KEY && process.env.E2E_RESEND_DOMAIN ?
      {
        apiKey: process.env.E2E_RESEND_API_KEY,
        domain: process.env.E2E_RESEND_DOMAIN,
      } satisfies ResendConfig & { domain: string }
    : undefined,
  /**
   * @inbound-mail scenarios skip once this many mails arrived today: the
   * free plan takes 100 a day, and bexio mails the seeded readers too.
   */
  resendDailyBudget: Number(process.env.E2E_RESEND_DAILY_BUDGET) || 90,
  /** The bexio *test* company the target's bexio provider writes to. */
  bexio:
    process.env.E2E_BEXIO_API_TOKEN ?
      ({
        token: process.env.E2E_BEXIO_API_TOKEN,
        testMailbox: process.env.E2E_BEXIO_TEST_MAILBOX || undefined,
      } satisfies BexioConfig)
    : undefined,
  /** A real Mailchimp test audience and one of its interests: there is no fake. */
  mailchimp:
    (
      process.env.E2E_MAILCHIMP_API_KEY &&
      process.env.E2E_MAILCHIMP_LIST_ID &&
      process.env.E2E_MAILCHIMP_INTEREST_ID
    ) ?
      {
        apiKey: process.env.E2E_MAILCHIMP_API_KEY,
        listId: process.env.E2E_MAILCHIMP_LIST_ID,
        interestId: process.env.E2E_MAILCHIMP_INTEREST_ID,
      }
    : undefined,
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
  '@mail': () =>
    !mailBackend(env) ?
      'needs MAILPIT_URL, or E2E_IMAP_USER and E2E_IMAP_PASSWORD'
    : undefined,
  '@inbound-mail': () =>
    !env.resend ? 'needs E2E_RESEND_API_KEY and E2E_RESEND_DOMAIN' : undefined,
  // Real invoices in a bexio company: only ever the test company.
  '@bexio': () =>
    isProduction ? 'never touches the production bexio company'
    : !env.bexio ? 'needs E2E_BEXIO_API_TOKEN (the bexio test company)'
    : undefined,
  // Points the tenant's one sync provider at the test audience.
  '@mailchimp': () =>
    isProduction ? "never reconfigures production's Mailchimp"
    : !env.mailchimp ?
      'needs E2E_MAILCHIMP_API_KEY, E2E_MAILCHIMP_LIST_ID and E2E_MAILCHIMP_INTEREST_ID'
    : undefined,
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
