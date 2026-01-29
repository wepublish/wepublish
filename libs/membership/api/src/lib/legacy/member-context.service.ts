import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PaymentsService } from '@wepublish/payment/api';
import { MailContext } from '@wepublish/mail/api';
import { MemberContext } from './member-context';

@Injectable()
export class MemberContextService extends MemberContext {
  constructor(
    prisma: PrismaClient,
    payments: PaymentsService,
    mailContext: MailContext
  ) {
    super({
      mailContext,
      paymentProviders: payments.getProviders(),
      prisma,
    });
  }
}
