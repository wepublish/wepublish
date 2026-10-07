import { Injectable, NotFoundException } from '@nestjs/common';
import {
  PaymentPeriodicity,
  PrismaClient,
  Subscription,
  SubscriptionDeactivationReason,
  SubscriptionEvent,
  UserEvent,
} from '@prisma/client';
import { MailContext } from '@wepublish/mail/api';

import {
  PaymentMail,
  RenewalSuccessMailService,
} from '../renewal-mail/renewal-success-mail.service';
import { SubscriptionEventDictionary } from '../subscription-event-dictionary/subscription-event-dictionary';
import { ActionMailNoMailReason } from './action-mail-reason';

/** The mail an action would send (template), or why it sends none (reason). */
export type ActionMail = {
  event: SubscriptionEvent | UserEvent;
} & (
  | { mailTemplateId: string; mailTemplateName: string }
  | { noMailReason: ActionMailNoMailReason }
);

export type SubscriptionDraft = {
  memberPlanID: string;
  paymentMethodID: string;
  paymentPeriodicity: PaymentPeriodicity;
  autoRenew: boolean;
};

/**
 * Which mail an admin action in the editor would send to the user, so the
 * editor can ask the admin whether it goes out before running the action.
 * Each lookup uses the same rules as the code that sends the mail.
 */
@Injectable()
export class ActionMailService {
  private subscriptionEventDictionary = new SubscriptionEventDictionary(
    this.prisma
  );

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private renewalSuccessMail: RenewalSuccessMailService
  ) {}

  /** The subscribe mail of `MemberContext.createSubscription`. */
  async forSubscriptionCreation(draft: SubscriptionDraft): Promise<ActionMail> {
    return this.named(
      SubscriptionEvent.SUBSCRIBE,
      await this.subscriptionEventDictionary.getSubsciptionTemplateIdentifier(
        draft as Subscription,
        SubscriptionEvent.SUBSCRIBE
      )
    );
  }

  /** The mail of `MemberContext.sendSubscriptionDeactivationMail`. */
  async forSubscriptionCancellation(
    subscriptionId: string,
    reason: SubscriptionDeactivationReason
  ): Promise<ActionMail> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription with id ${subscriptionId} was not found.`
      );
    }

    const event =
      reason === SubscriptionDeactivationReason.invoiceNotPaid ?
        SubscriptionEvent.DEACTIVATION_UNPAID
      : SubscriptionEvent.DEACTIVATION_BY_USER;

    return this.named(
      event,
      await this.subscriptionEventDictionary.getSubsciptionTemplateIdentifier(
        subscription,
        event
      )
    );
  }

  /** The registration mail of `UserService.createUser`. */
  async forAccountCreation(): Promise<ActionMail> {
    return this.named(
      UserEvent.ACCOUNT_CREATION,
      await this.mailContext.getUserTemplateId(
        UserEvent.ACCOUNT_CREATION,
        false
      )
    );
  }

  /** The payment confirmation `InvoiceService.markInvoiceAsPaid` triggers. */
  async forInvoicePayment(invoiceId: string): Promise<ActionMail> {
    const mail: PaymentMail =
      await this.renewalSuccessMail.templateForPayment(invoiceId);

    return 'mailTemplateId' in mail ?
        this.named(SubscriptionEvent.RENEWAL_SUCCESS, mail.mailTemplateId)
      : { event: SubscriptionEvent.RENEWAL_SUCCESS, ...mail };
  }

  private async named(
    event: SubscriptionEvent | UserEvent,
    mailTemplateId: string | null | undefined
  ): Promise<ActionMail> {
    const template =
      mailTemplateId ?
        await this.prisma.mailTemplate.findUnique({
          where: { id: mailTemplateId },
          select: { id: true, name: true },
        })
      : null;

    return template ?
        { event, mailTemplateId: template.id, mailTemplateName: template.name }
      : { event, noMailReason: ActionMailNoMailReason.noTemplate };
  }
}
