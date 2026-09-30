import { PrismaClient } from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';
import { PaymentsService } from '@wepublish/payment/api';
import { MemberContextService } from './member-context.service';
import { NewsletterSubscriberService } from '../newsletter/newsletter-subscriber.service';

describe('MemberContextService', () => {
  it('uses the newsletter subscriber service for automatic newsletter lists', () => {
    const newsletter = {} as NewsletterSubscriberService;

    const service = new MemberContextService(
      {} as PrismaClient,
      { getProviders: () => [] } as unknown as PaymentsService,
      {} as MailContext,
      newsletter
    );

    expect(service.newsletter).toBe(newsletter);
  });
});
