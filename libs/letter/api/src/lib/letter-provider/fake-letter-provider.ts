import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  BaseLetterProvider,
  LetterProviderProps,
} from './base-letter-provider';
import {
  DispatchLetterProps,
  LetterLogStatus,
  LetterProviderError,
  LetterState,
  SendLetterProps,
  SendLetterResult,
  WebhookForSendLetterProps,
} from './letter-provider.interface';

export class FakeLetterProvider extends BaseLetterProvider {
  private logger = new Logger('FakeLetterProvider');
  private letters = new Map<string, Buffer>();

  constructor(props: LetterProviderProps) {
    super(props);
  }

  async getName(): Promise<string> {
    return (await this.getConfig())?.name ?? 'Fake letter provider';
  }

  async sendLetter(props: SendLetterProps): Promise<SendLetterResult> {
    const providerLetterID = randomUUID();
    this.letters.set(providerLetterID, props.file);

    this.logger.log(
      `Pretending to send letter ${props.letterLogID} (${props.file.length} bytes) to ${props.recipient.zip} ${props.recipient.city}`
    );

    return { providerLetterID, state: LetterState.accepted };
  }

  async dispatchLetter(props: DispatchLetterProps): Promise<void> {
    this.logger.log(`Pretending to dispatch letter ${props.providerLetterID}`);
  }

  async cancelLetter(providerLetterID: string): Promise<void> {
    this.letters.delete(providerLetterID);
  }

  async getLetterFile(providerLetterID: string): Promise<Buffer> {
    const file = this.letters.get(providerLetterID);

    if (!file) {
      throw new LetterProviderError(`Unknown letter ${providerLetterID}`);
    }

    return file;
  }

  async webhookForSendLetter(
    _props: WebhookForSendLetterProps
  ): Promise<LetterLogStatus[]> {
    return [];
  }
}
