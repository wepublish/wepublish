import { MailLogType, User, UserAddress } from '@prisma/client';

/**
 * Injection token for whoever can print a template as a letter. The mail lib
 * only hands over the send; the letter lib does it. Optional, so an
 * installation without letters keeps mailing as before.
 */
export const LETTER_SENDER = 'LETTER_SENDER';

export type LetterRecipient = User & { address: UserAddress | null };

/**
 * A pdf printed after the rendered template, e.g. the payment provider's
 * invoice with its payment slip.
 */
export interface LetterAttachment {
  content: Buffer;
  name: string;
}

export interface LetterRecipientOptions {
  /**
   * The letter carries a payment slip, which the print vendor posts within
   * Switzerland only.
   */
  withPaymentSlip?: boolean;
}

export interface LetterSender {
  /** A print vendor and a renderer with their credentials filled in. */
  isConfigured(): Promise<boolean>;
  /** Whether the user's postal address is complete enough to be posted to. */
  canReceiveLetters(
    user: LetterRecipient,
    options?: LetterRecipientOptions
  ): boolean;
  /**
   * Render the template for the user and hand it to the print vendor. Writes
   * the mail log entry itself, submitted or rejected, and rethrows failures.
   */
  sendLetter(props: {
    mailTemplateId: string;
    recipient: LetterRecipient;
    data: Record<string, any>;
    mailLogId?: string;
    mailSendJobId?: string | null;
    /** Bookkeeping an automated send needs, so a retry can recognise the letter. */
    log?: { mailIdentifier?: string; type?: MailLogType };
    attachment?: LetterAttachment;
  }): Promise<string>;
}

/** A letter that could not be rendered or posted; the log entry is written. */
export class LetterDeliveryError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'LetterDeliveryError';
  }
}
