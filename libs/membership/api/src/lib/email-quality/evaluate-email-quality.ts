import { EmailQualityEventType, EmailQualityLevel } from '@prisma/client';
import { EmailQualityConfig } from './email-quality.config';

export type EmailQualityEvidence = {
  type: EmailQualityEventType;
  occurredAt: Date;
  email: string;
  detail?: string | null;
};

export type EmailQualityInput = {
  /** The user's current address; evidence about any other address is ignored. */
  email: string;
  events: EmailQualityEvidence[];
  lastLogin: Date | null;
  emailVerifiedAt: Date | null;
  /** Mails delivered to the current address. */
  mails: { count: number; earliestSentDate: Date | null };
  now: Date;
  config: EmailQualityConfig;
};

export type EmailQualityVerdict = {
  level: EmailQualityLevel;
  /** Machine key of the deciding evidence, e.g. `hardBounce` or `login`. */
  reason: string;
  /** When the deciding evidence happened, null when nothing decided. */
  since: Date | null;
};

const DEAD_TYPES = new Set<EmailQualityEventType>([
  EmailQualityEventType.hardBounce,
  EmailQualityEventType.invalid,
  EmailQualityEventType.blocked,
  EmailQualityEventType.spamComplaint,
  EmailQualityEventType.unsubscribed,
]);

// Opens are deliberately absent: mail clients and scanners load tracking
// pixels on their own.
const PROOF_TYPES = new Set<EmailQualityEventType>([
  EmailQualityEventType.clicked,
  EmailQualityEventType.verified,
]);

const DAY_MS = 24 * 60 * 60 * 1000;

const newest = <T extends { at: Date }>(items: T[]) =>
  items.reduce<T | undefined>(
    (found, item) => (!found || item.at > found.at ? item : found),
    undefined
  );

/**
 * Derives the quality of the user's current address from provider evidence
 * and the user's own activity. Pure, so the rules can be read in one place.
 */
export const evaluateEmailQuality = ({
  email,
  events,
  lastLogin,
  emailVerifiedAt,
  mails,
  now,
  config,
}: EmailQualityInput): EmailQualityVerdict => {
  const address = email.trim().toLowerCase();
  const forAddress = events.filter(
    event => event.email.trim().toLowerCase() === address
  );

  const dead = newest(
    forAddress
      .filter(event => DEAD_TYPES.has(event.type))
      .map(event => ({ at: event.occurredAt, event }))
  );
  const proof = newest([
    ...forAddress
      .filter(event => PROOF_TYPES.has(event.type))
      .map(event => ({ reason: event.type as string, at: event.occurredAt })),
    ...(lastLogin ? [{ reason: 'login', at: lastLogin }] : []),
    ...(emailVerifiedAt ?
      [{ reason: 'emailVerified', at: emailVerifiedAt }]
    : []),
  ]);

  // A refusal stands until the person proves the address works again.
  if (dead && (!proof || proof.at <= dead.at)) {
    const { type, detail } = dead.event;

    return {
      level: EmailQualityLevel.dead,
      reason: detail ? `${type}: ${detail}` : type,
      since: dead.at,
    };
  }

  const windowMs = config.unresponsiveAfterDays * DAY_MS;
  const windowStart = new Date(now.getTime() - windowMs);

  if (proof && proof.at >= windowStart) {
    return {
      level: EmailQualityLevel.active,
      reason: proof.reason,
      since: proof.at,
    };
  }

  // Mails arrive, nobody reacts: the address is probably no longer read.
  if (
    mails.earliestSentDate &&
    mails.count >= config.minMailsForUnresponsive &&
    mails.earliestSentDate <= windowStart
  ) {
    const lastSign =
      proof && proof.at > mails.earliestSentDate ?
        proof.at
      : mails.earliestSentDate;

    return {
      level: EmailQualityLevel.unresponsive,
      reason: 'noInteraction',
      since: new Date(lastSign.getTime() + windowMs),
    };
  }

  return {
    level: EmailQualityLevel.unknown,
    reason: 'noEvidence',
    since: null,
  };
};
