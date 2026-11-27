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
    log?: LetterLogDetails;
    attachment?: LetterAttachment;
  }): Promise<string>;
  /**
   * Whether the print vendor prints what it is handed without a person
   * confirming each letter there. Where someone confirms every letter anyway,
   * a letter the vendor holds is theirs to deal with.
   */
  sendsAutomatically(): Promise<boolean>;
  /**
   * Take back a letter the vendor holds for someone to act on, so another
   * one can be posted in its place. The vendor is asked first: a letter
   * somebody fixed, sent or removed there is left alone, and so is one the
   * vendor does not let go. Only `withdrawn` allows a new letter, which is
   * then to be posted under `replacementLogId`: its entry is written with the
   * withdrawal, as not handed over yet, so a replacement that never gets
   * through is posted again like any other.
   */
  withdrawHeldLetter(
    mailLogId: string,
    replacementLogId: string
  ): Promise<HeldLetterOutcome>;
}

/**
 * What the sender knows about a letter and the letter side writes into its log
 * entry: how a retry recognises it, where it came from, and what it is about.
 */
export type LetterLogDetails = {
  mailIdentifier?: string;
  type?: MailLogType;
  subscriptionId?: string | null;
  invoiceId?: string | null;
};

/**
 * `withdrawn`: gone at the vendor, its entry cancelled and the replacement's
 * entry written. `left`: untouched.
 */
export type HeldLetterOutcome = 'withdrawn' | 'left';

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
