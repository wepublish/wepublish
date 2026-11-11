import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { NewsletterMailchimpService } from '@wepublish/newsletter/api';
import { METER_SECRET } from './meter-token';
import {
  deriveNewsletterSecret,
  signNewsletterToken,
  verifyNewsletterToken,
} from './newsletter-token';
import { NewsletterStatus } from './reader-context';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Newsletter walls: a reader gives their email, which is signed up with the
 * Mailchimp integration, and gets a token that lets them past every newsletter
 * wall and keeps newsletter prompts away.
 */
@Injectable()
export class NewsletterSignupService {
  private logger = new Logger(NewsletterSignupService.name);
  private secret: Buffer;

  constructor(
    @Inject(METER_SECRET) meterSecret: Buffer,
    private mailchimp: NewsletterMailchimpService
  ) {
    this.secret = deriveNewsletterSecret(meterSecret);
  }

  async signUp(email: string): Promise<string> {
    const address = email.trim().toLowerCase();

    if (address.length > 254 || !EMAIL.test(address)) {
      throw new BadRequestException('Invalid email address.');
    }

    // Without an integration there is nowhere to sign up, which is the
    // medium's to fix: the reader still gets past the wall.
    if (!(await this.mailchimp.subscribe(address))) {
      this.logger.warn(
        'A reader signed up at a newsletter wall, but no Mailchimp integration is set up.'
      );
    }

    return signNewsletterToken(
      { email: address, signedUpAt: new Date() },
      this.secret
    );
  }

  /** `subscribed` for a token signed here, otherwise nothing is known. */
  statusOf(token: string | null | undefined): NewsletterStatus | undefined {
    return verifyNewsletterToken(token, this.secret) ? 'subscribed' : undefined;
  }
}
