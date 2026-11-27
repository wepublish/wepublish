import { FeaturesService } from '@wepublish/features/api';
import {
  HeldLetterOutcome,
  LetterRecipient,
  LetterRecipientOptions,
  LetterSender,
} from '@wepublish/mail/api';
import { LetterContext, SendTemplateLetterProps } from './letter-context';

/**
 * The letter sender the mail lib prints automated mails through. It only
 * answers "configured" while the medium has both letter features switched on
 * and a letter integration set up, so the feature keys live here and nowhere
 * near the senders of subscription mails.
 */
export class GatedLetterSender implements LetterSender {
  constructor(
    private context: LetterContext,
    private features: FeaturesService
  ) {}

  async isConfigured(): Promise<boolean> {
    return (
      (await this.features.isEnabled('paper-letters')) &&
      (await this.features.isEnabled('paper-letter-flow')) &&
      (await this.context.isConfigured())
    );
  }

  canReceiveLetters(
    user: LetterRecipient,
    options?: LetterRecipientOptions
  ): boolean {
    return this.context.canReceiveLetters(user, options);
  }

  sendLetter(props: SendTemplateLetterProps): Promise<string> {
    return this.context.sendLetter(props);
  }

  sendsAutomatically(): Promise<boolean> {
    return this.context.sendsAutomatically();
  }

  withdrawHeldLetter(
    mailLogId: string,
    replacementLogId: string
  ): Promise<HeldLetterOutcome> {
    return this.context.withdrawHeldLetter(mailLogId, replacementLogId);
  }
}

/**
 * Whether templates may carry attachments. They ship with the letters, whose
 * pdf renderer converts them; while the feature is off nothing is attached.
 */
export const mailAttachmentsEnabled =
  (features: FeaturesService) => (): Promise<boolean> =>
    features.isEnabled('paper-letters');
