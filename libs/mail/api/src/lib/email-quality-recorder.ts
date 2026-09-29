import { Logger } from '@nestjs/common';
import { EmailQualityEventSource } from '@prisma/client';
import { MailQualitySignal } from './mail-provider/mail-provider.interface';

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

  /** Evidence about a user's address outside of a mail, e.g. a redeemed login link. */
  recordUserSignal(props: {
    userId: string;
    signal: MailQualitySignal;
    source: EmailQualityEventSource;
  }): Promise<void>;
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
