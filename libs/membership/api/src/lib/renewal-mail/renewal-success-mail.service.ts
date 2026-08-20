import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { InvoicePaidListener } from '@wepublish/payment/api';
import { SubscriptionEventDictionary } from '../subscription-event-dictionary/subscription-event-dictionary';

type TemplateLookupSubscription = {
  id: string;
  memberPlanID: string;
  paymentMethodID: string;
  paymentPeriodicity: PaymentPeriodicity;
  autoRenew: boolean;
};

@Injectable()
export class RenewalSuccessMailService implements InvoicePaidListener {
  private subscriptionEventDictionary = new SubscriptionEventDictionary(
    this.prisma
  );
  private logger = new Logger('RenewalSuccessMailService');

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext
  ) {}

  public async onInvoicePaid(invoiceId: string): Promise<void> {
    try {
      await this.sendIfRenewal(invoiceId);
    } catch (error) {
      this.logger.error(
        `Could not evaluate paid invoice ${invoiceId} for a renewal success mail: ${(error as Error).message}`
      );
    }
  }

  private async sendIfRenewal(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        subscriptionPeriods: {
          orderBy: { startsAt: 'asc' },
        },
        subscription: {
          include: {
            user: true,
            memberPlan: true,
            paymentMethod: true,
          },
        },
      },
    });

    if (
      !invoice ||
      !invoice.paidAt ||
      !invoice.subscription ||
      !invoice.subscription.user ||
      invoice.suppressRenewalSuccessMail ||
      invoice.renewalSuccessMailSentAt
    ) {
      return;
    }

    const user = invoice.subscription.user;
    const { subscription, items, subscriptionPeriods, ...invoiceData } =
      invoice;
    const [invoicePeriod] = subscriptionPeriods;

    if (!invoicePeriod) {
      return;
    }

    const earlierPeriods = await this.prisma.subscriptionPeriod.count({
      where: {
        subscriptionId: subscription.id,
        startsAt: { lt: invoicePeriod.startsAt },
      },
    });

    if (earlierPeriods === 0) {
      this.logger.log(
        `Invoice ${invoiceId} is the first period of subscription ${subscription.id}, no renewal success mail`
      );

      return;
    }

    const mailTemplateId = await this.findRenewalSuccessTemplate(subscription);

    if (!mailTemplateId) {
      this.logger.log(
        `No RENEWAL_SUCCESS template configured for subscription ${subscription.id}, skipping invoice ${invoiceId}`
      );

      return;
    }

    const claim = await this.prisma.invoice.updateMany({
      where: {
        id: invoiceId,
        renewalSuccessMailSentAt: null,
        suppressRenewalSuccessMail: false,
      },
      data: { renewalSuccessMailSentAt: new Date() },
    });

    if (claim.count === 0) {
      return;
    }

    try {
      await this.mailContext.sendMail({
        mailTemplateId,
        recipient: user,
        mailType: mailLogType.SubscriptionFlow,
        optionalData: {
          errorCode: '',
          invoice: invoiceData,
          subscriptionPeriods,
          items,
          subscription,
        },
      });

      this.logger.log(
        `Sent RENEWAL_SUCCESS mail for invoice ${invoiceId} using template ${mailTemplateId}`
      );
    } catch (error) {
      this.logger.error(
        `Sending the RENEWAL_SUCCESS mail for invoice ${invoiceId} failed: ${(error as Error).message}`
      );
    }
  }

  private async findRenewalSuccessTemplate(
    subscription: TemplateLookupSubscription
  ): Promise<string | null> {
    try {
      const actions =
        await this.subscriptionEventDictionary.getActionsForSubscriptions({
          memberplanId: subscription.memberPlanID,
          paymentMethodId: subscription.paymentMethodID,
          periodicity: subscription.paymentPeriodicity,
          autorenwal: subscription.autoRenew,
          events: [SubscriptionEvent.RENEWAL_SUCCESS],
        });

      return (
        actions.find(
          action => action.type === SubscriptionEvent.RENEWAL_SUCCESS
        )?.mailTemplateId ?? null
      );
    } catch (error) {
      this.logger.error(
        `Could not resolve the RENEWAL_SUCCESS template for subscription ${subscription.id}: ${(error as Error).message}`
      );

      return null;
    }
  }
}
