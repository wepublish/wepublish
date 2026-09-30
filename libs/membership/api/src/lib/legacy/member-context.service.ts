import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PaymentsService } from '@wepublish/payment/api';
import { MailContext } from '@wepublish/mail/api';
import { MemberContext } from './member-context';
import { NewsletterSubscriberService } from '../newsletter/newsletter-subscriber.service';

@Injectable()
export class MemberContextService extends MemberContext {
  constructor(
    prisma: PrismaClient,
    payments: PaymentsService,
    mailContext: MailContext,
    newsletter: NewsletterSubscriberService
  ) {
    super({
      mailContext,
      paymentProviders: payments.getProviders(),
      prisma,
      newsletter,
    });
  }
}
