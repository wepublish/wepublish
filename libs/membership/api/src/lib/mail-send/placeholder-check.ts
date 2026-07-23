import { MailTemplate } from '@prisma/client';
import { extractPlaceholders, resolvableKeys } from '@wepublish/mail/api';
import {
  assembleMailData,
  MailTemplateContextId,
  SAMPLE_INVOICE,
  SAMPLE_JWT,
  SAMPLE_SUBSCRIPTION,
} from '../mail-template/mail-template-data';

/**
 * A representative recipient covering every non-sensitive `User` column, so the
 * availability check reflects the real send — which passes the full user row
 * (minus the sensitive fields the renderer strips). Dates are real `Date`s so
 * their derived `_date`/`_dateTime` placeholder variants are counted too.
 */
const SAMPLE_RECIPIENT = {
  id: 'ckpqr5abc0001',
  createdAt: new Date('2025-03-01T12:00:00.000Z'),
  modifiedAt: new Date('2026-06-30T08:22:10.000Z'),
  birthday: new Date('1990-05-14T00:00:00.000Z'),
  email: 'jane.doe@example.com',
  emailVerifiedAt: new Date('2025-02-01T12:00:00.000Z'),
  pendingEmail: 'new.jane@example.com',
  pendingEmailAt: new Date('2026-06-01T12:00:00.000Z'),
  name: 'Doe',
  firstName: 'Jane',
  flair: 'Vorstandsmitglied',
  active: true,
  lastLogin: new Date('2026-06-30T08:22:10.000Z'),
  userImageID: 'ckimg000001',
  note: 'A note',
};

type TemplateContent = Pick<
  MailTemplate,
  'subject' | 'htmlContent' | 'textContent' | 'context'
>;

function templateText(template: TemplateContent): string {
  return [
    template.subject,
    template.htmlContent,
    template.textContent ?? '',
  ].join('\n');
}

/**
 * The `{{ placeholders }}` a template uses that would render empty for a given
 * send. Mirrors exactly the data the send binds:
 *
 * - The full recipient user and a login JWT are always available.
 * - Subscription data (`optional.*`) is available only for a subscription-based
 *   audience, assembled for the template's context — a missing context counts
 *   as `custom`, matching the send.
 *
 * Availability is computed from the same enrichment pipeline the renderer uses
 * (`resolvableKeys`), so this can never disagree with what actually renders.
 * Lookups are case-insensitive, matching `renderTemplate`.
 */
export function findMissingPlaceholders(
  template: TemplateContent,
  withSubscriptionData: boolean
): string[] {
  const contextId = (template.context ?? 'custom') as MailTemplateContextId;

  const data =
    withSubscriptionData ?
      assembleMailData(
        contextId,
        {
          user: SAMPLE_RECIPIENT,
          subscription: SAMPLE_SUBSCRIPTION,
          invoice: SAMPLE_INVOICE,
        },
        SAMPLE_JWT
      )
    : { user: SAMPLE_RECIPIENT, optional: {}, jwt: SAMPLE_JWT };

  const available = new Set(resolvableKeys(data).map(key => key.toLowerCase()));

  return extractPlaceholders(templateText(template)).filter(
    key => !available.has(key.toLowerCase())
  );
}
