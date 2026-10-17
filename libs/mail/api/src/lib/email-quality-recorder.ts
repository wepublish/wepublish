import { Logger } from '@nestjs/common';
import { EmailQualityEventSource, EmailQualityEventType } from '@prisma/client';
import { MailQualitySignal } from './mail-provider/mail-provider.interface';

// Mandrill's reject reasons; the other providers use the same words. A
// soft bounce is temporary and says nothing about the address.
const REJECT_REASON_TYPES: Record<string, EmailQualityEventType> = {
  'hard-bounce': EmailQualityEventType.hardBounce,
  invalid: EmailQualityEventType.invalid,
  spam: EmailQualityEventType.spamComplaint,
  unsub: EmailQualityEventType.unsubscribed,
  custom: EmailQualityEventType.blocked,
};

/** What a provider's refusal of an address at send time says about it, if anything. */
export const qualityTypeForRejectReason = (
  reason: string | undefined | null
): EmailQualityEventType | null =>
  REJECT_REASON_TYPES[reason?.trim().toLowerCase() ?? ''] ?? null;

/**
 * Injection token for whoever keeps track of email address quality. The mail
 * lib only reports evidence; the membership lib evaluates it. Optional, so an
 * installation without it keeps sending mails as before.
 */
export const EMAIL_QUALITY_RECORDER = 'EMAIL_QUALITY_RECORDER';

export interface EmailQualityRecorder {
  /** Evidence from a sent mail: a provider event, a polled state or a refusal at send time. */
  recordMailSignals(props: {
    mailLogId: string;
    /** Known at send time; otherwise looked up from the mail log. */
    userId?: string;
    signals: MailQualitySignal[];
    source: EmailQualityEventSource;
  }): Promise<void>;

  /**
   * Evidence about an address without a mail of ours behind it, e.g. a
   * newsletter campaign bounce or an address verification. Applies to every
   * user with that address.
   */
  recordAddressSignals(props: {
    email: string;
    signals: MailQualitySignal[];
    source: EmailQualityEventSource;
  }): Promise<void>;

  /** Re-derives the level, needed after the user's address changed. */
  recompute(userId: string): Promise<unknown>;
}

const logger = new Logger('EmailQualityRecorder');

/** Recording is bookkeeping: it must never fail the mail, login or webhook it belongs to. */
export const recordEmailQualitySafely = async (
  recorder: EmailQualityRecorder | undefined | null,
  record: (recorder: EmailQualityRecorder) => Promise<void>
) => {
  if (!recorder) {
    return;
  }

  try {
    await record(recorder);
  } catch (error) {
    logger.error(
      `Could not record email quality evidence: ${(error as Error).message}`,
      (error as Error).stack
    );
  }
};
