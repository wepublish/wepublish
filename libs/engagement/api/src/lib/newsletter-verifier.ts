import { Injectable } from '@nestjs/common';
import { NewsletterStatus } from './reader-context';

/**
 * Whether a reader really subscribed to the newsletter. Nothing can tell yet:
 * the Mailchimp sync adds every active user as `subscribed` and
 * `addMailchimpContact` takes the status from the client. That is why there is
 * no newsletter requirement or audience. Provide another `NewsletterVerifier`
 * (e.g. one reading a Mailchimp tag) to change that.
 */
export abstract class NewsletterVerifier {
  abstract status(reader: { userId?: string }): Promise<NewsletterStatus>;
}

@Injectable()
export class UnavailableNewsletterVerifier extends NewsletterVerifier {
  async status(): Promise<NewsletterStatus> {
    return 'unknown';
  }
}
