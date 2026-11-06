import { EmailQualityEventType, EmailQualityLevel } from '@prisma/client';
import { matchesPlaceholderPattern } from './email-quality.config';

export type EmailQualityEvidence = {
  type: EmailQualityEventType;
  occurredAt: Date;
  email: string;
  detail?: string | null;
};

export type EmailQualityVerdict = {
  level: EmailQualityLevel;
  /** Machine key of the deciding rule, e.g. `hardBounce` or `pattern`. */
  reason: string;
  /** When the deciding evidence happened, null when nothing decided. */
  since: Date | null;
  /** Set when an editor entry decided the level. */
  manualLevel: EmailQualityLevel | null;
};

// Mandrill reject reasons (see RECIPIENT_REJECT_REASONS in the mail lib)
const UNDELIVERABLE_REJECT_REASONS = ['hard-bounce', 'invalid'];
const BLOCKED_REJECT_REASONS = ['spam', 'unsub', 'custom'];

const rejectReason = ({ detail }: EmailQualityEvidence) =>
  detail?.trim().toLowerCase() ?? '';

const isBlocking = (event: EmailQualityEvidence) =>
  event.type === EmailQualityEventType.spamComplaint ||
  event.type === EmailQualityEventType.unsubscribed ||
  (event.type === EmailQualityEventType.rejected &&
    BLOCKED_REJECT_REASONS.includes(rejectReason(event)));

const isUndeliverable = (event: EmailQualityEvidence) =>
  event.type === EmailQualityEventType.hardBounce ||
  event.type === EmailQualityEventType.manualInvalid ||
  (event.type === EmailQualityEventType.rejected &&
    UNDELIVERABLE_REJECT_REASONS.includes(rejectReason(event)));

// Opens are no proof: mail clients and scanners load tracking pixels on their
// own. They only count once the unresponsive rule exists.
const isProofOfReach = (event: EmailQualityEvidence) =>
  event.type === EmailQualityEventType.clicked ||
  event.type === EmailQualityEventType.jwtLogin ||
  event.type === EmailQualityEventType.emailConfirmed ||
  event.type === EmailQualityEventType.manualConfirmed;

const isManual = (event: EmailQualityEvidence) =>
  event.type === EmailQualityEventType.manualConfirmed ||
  event.type === EmailQualityEventType.manualInvalid;

const latest = (
  events: EmailQualityEvidence[],
  predicate: (event: EmailQualityEvidence) => boolean
) =>
  events.reduce<EmailQualityEvidence | undefined>(
    (found, event) =>
      predicate(event) && (!found || event.occurredAt >= found.occurredAt) ?
        event
      : found,
    undefined
  );

const verdict = (
  level: EmailQualityLevel,
  event: EmailQualityEvidence | undefined,
  reason = event?.type ?? 'noEvidence'
): EmailQualityVerdict => ({
  level,
  reason,
  since: event?.occurredAt ?? null,
  manualLevel: event && isManual(event) ? level : null,
});

/**
 * Derives the quality of the user's current address from recorded evidence.
 * Only evidence about that exact address counts, so an email change starts
 * over at unknown.
 */
export const evaluateEmailQuality = (
  allEvents: EmailQualityEvidence[],
  {
    email,
    placeholderPatterns,
  }: { email: string; placeholderPatterns: string[] }
): EmailQualityVerdict => {
  const address = email.trim().toLowerCase();
  const forAddress = allEvents.filter(
    event => event.email.trim().toLowerCase() === address
  );

  // An editor reset wipes everything before it.
  const reset = latest(
    forAddress,
    event => event.type === EmailQualityEventType.manualReset
  );
  const events =
    reset ?
      forAddress.filter(event => event.occurredAt > reset.occurredAt)
    : forAddress;

  // A generated address can never be reached, whatever else happened.
  if (matchesPlaceholderPattern(address, placeholderPatterns)) {
    return verdict(EmailQualityLevel.placeholder, undefined, 'pattern');
  }

  const placeholder = latest(
    events,
    event => event.type === EmailQualityEventType.placeholderDetected
  );

  if (placeholder) {
    return verdict(EmailQualityLevel.placeholder, placeholder);
  }

  const proof = latest(events, isProofOfReach);
  const blocking = latest(events, isBlocking);

  // A complaint or unsubscribe only ends when an editor confirms explicitly.
  if (blocking) {
    const confirmed = latest(
      events,
      event => event.type === EmailQualityEventType.manualConfirmed
    );

    if (!confirmed || confirmed.occurredAt <= blocking.occurredAt) {
      return verdict(EmailQualityLevel.blocked, blocking);
    }
  }

  const undeliverable = latest(events, isUndeliverable);

  if (
    undeliverable &&
    (!proof || proof.occurredAt <= undeliverable.occurredAt)
  ) {
    return verdict(EmailQualityLevel.undeliverable, undeliverable);
  }

  if (proof) {
    return verdict(EmailQualityLevel.confirmed, proof);
  }

  return verdict(EmailQualityLevel.unknown, undefined);
};
