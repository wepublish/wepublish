import type { TFunction } from 'i18next';

/** `emailQuality:dead` → `emailQuality_dead`: a colon would be a namespace to i18next. */
export const reasonKey = (reason: string) => reason.replace(':', '_');

export type DeliveryChange = {
  origin?: string | null;
  reason?: string | null;
  changedAt?: string | null;
  changedBy?: { firstName?: string | null; name: string } | null;
};

/**
 * How a person got onto their channel, as one line: «Von Hand · Beibehalten ·
 * 12.10.2026 · Jane Doe». Null for someone who never had a decision.
 */
export function describeDeliveryChange(
  t: TFunction,
  { origin, reason, changedAt, changedBy }: DeliveryChange,
  formatDate: (iso: string) => string
): string | null {
  if (!origin) {
    return null;
  }

  return [
    t(`deliveryMode.origin.${origin}`),
    reason && t(`deliveryMode.reason.${reasonKey(reason)}`),
    changedAt && formatDate(changedAt),
    changedBy &&
      [changedBy.firstName, changedBy.name].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(' · ');
}
