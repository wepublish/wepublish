import { Injectable, Logger } from '@nestjs/common';
import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { MailContext, mailLogType } from '@wepublish/mail/api';
import { InvoicePaidListener } from '@wepublish/payment/api';
import { ActionMailNoMailReason } from '../action-mail/action-mail-reason';
import { SubscriptionEventDictionary } from '../subscription-event-dictionary/subscription-event-dictionary';

export type PaymentMail =
  | { mailTemplateId: string }
  | { noMailReason: ActionMailNoMailReason };

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

  /**
   * The RENEWAL_SUCCESS template that paying this invoice would send, or why
   * paying it sends nothing. Lets an admin decide before marking the invoice
   * as paid.
   */
  public async templateForPayment(invoiceId: string): Promise<PaymentMail> {
    const invoice = await this.loadInvoice(invoiceId);

    return invoice ?
        this.renewalSuccessTemplate(invoice)
      : { noMailReason: ActionMailNoMailReason.notApplicable };
  }

  public async onInvoicePaid(invoiceId: string): Promise<void> {
    const invoice = await this.loadInvoice(invoiceId);

    if (!invoice?.paidAt) {
      return;
    }

    const mail = await this.renewalSuccessTemplate(invoice);
    const user = invoice.subscription?.user;

    if (!('mailTemplateId' in mail) || !user) {
      return;
    }

    const { mailTemplateId } = mail;

    const { subscription, items, subscriptionPeriods, ...invoiceData } =
      invoice;

    const claimedAt = new Date();
    const claim = await this.prisma.invoice.updateMany({
      where: {
        id: invoiceId,
        renewalSuccessMailSentAt: null,
        suppressRenewalSuccessMail: false,
      },
      data: { renewalSuccessMailSentAt: claimedAt },
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
    } catch (error) {
      await this.releaseClaim(invoiceId, claimedAt);

      throw error;
    }

    this.logger.log(
      `Sent RENEWAL_SUCCESS mail for invoice ${invoiceId} using template ${mailTemplateId}`
    );
  }

  private loadInvoice(invoiceId: string) {
    return this.prisma.invoice.findUnique({
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
  }

  private async renewalSuccessTemplate(
    invoice: NonNullable<
      Awaited<ReturnType<RenewalSuccessMailService['loadInvoice']>>
    >
  ): Promise<PaymentMail> {
    const { subscription, subscriptionPeriods } = invoice;
    const [invoicePeriod] = subscriptionPeriods;

    if (!subscription?.user || !invoicePeriod) {
      return { noMailReason: ActionMailNoMailReason.notApplicable };
    }

    if (
      invoice.suppressRenewalSuccessMail ||
      invoice.renewalSuccessMailSentAt
    ) {
      return { noMailReason: ActionMailNoMailReason.alreadyHandled };
    }

    const earlierPeriods = await this.prisma.subscriptionPeriod.count({
      where: {
        subscriptionId: subscription.id,
        startsAt: { lt: invoicePeriod.startsAt },
      },
    });

    if (earlierPeriods === 0) {
      this.logger.log(
        `Invoice ${invoice.id} is the first period of subscription ${subscription.id}, no renewal success mail`
      );

      return { noMailReason: ActionMailNoMailReason.firstPeriod };
    }

    const mailTemplateId = await this.findRenewalSuccessTemplate(subscription);

    if (!mailTemplateId) {
      this.logger.log(
        `No RENEWAL_SUCCESS template configured for subscription ${subscription.id}, skipping invoice ${invoice.id}`
      );

      return { noMailReason: ActionMailNoMailReason.noTemplate };
    }

    return { mailTemplateId };
  }

  private async releaseClaim(invoiceId: string, claimedAt: Date) {
    try {
      await this.prisma.invoice.updateMany({
        where: { id: invoiceId, renewalSuccessMailSentAt: claimedAt },
        data: { renewalSuccessMailSentAt: null },
      });
    } catch (error) {
      this.logger.error(
        `Could not release the RENEWAL_SUCCESS mail claim on invoice ${invoiceId} for a retry: ${(error as Error).message}`
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
