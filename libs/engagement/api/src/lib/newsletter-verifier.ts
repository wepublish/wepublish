import { Injectable } from '@nestjs/common';
import { NewsletterStatus } from './reader-context';

export abstract class NewsletterVerifier {
  abstract status(reader: { userId?: string }): Promise<NewsletterStatus>;
}

@Injectable()
export class UnavailableNewsletterVerifier extends NewsletterVerifier {
  async status(): Promise<NewsletterStatus> {
    return 'unknown';
  }
}
