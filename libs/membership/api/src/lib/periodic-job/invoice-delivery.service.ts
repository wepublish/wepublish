import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  Invoice,
  InvoiceItem,
  MailChannel,
  PaymentState,
  PrismaClient,
  Subscription,
  SubscriptionEvent,
  User,
} from '@prisma/client';
import {
  LetterDeliveryError,
  MailAttachment,
  MailAttachmentError,
  MailContext,
  MailController,
  MailControllerConfig,
  MailProviderRecipientError,
  mailLogType,
  resolveLetterRecipient,
} from '@wepublish/mail/api';
import {
  InvoiceWithItems,
  PaymentsService,
  RemoteInvoiceDocument,
  RemoteInvoiceResult,
} from '@wepublish/payment/api';
import { describeError } from '@wepublish/utils/api';
import { startOfDay } from 'date-fns';
import { SubscriptionEventDictionary } from '../subscription-event-dictionary/subscription-event-dictionary';
import { Action } from '../subscription-event-dictionary/subscription-event-dictionary.type';

/**
 * What the invoice-creation mail is told about its delivery: the reader to
 * print it for, if any, and the provider's invoice pdf that goes with it on
 * either channel.
 */
export type DeliverySide = Pick<
  MailControllerConfig,
  'letterRecipient' | 'attachment'
>;

/**
 * Whether the invoice-creation mail goes out now. `removed`: the provider
 * could not create the invoice and it is gone for the next attempt.
 * `deferred`: the invoice pdf is needed — the reader gets paper, or we.publish
 * delivers the invoice instead of the provider — but there is none yet, so
 * the night sweep sends it once there is.
 */
export type RemoteInvoiceOutcome =
  { send: DeliverySide } | { skip: 'removed' | 'deferred' };

const asAttachment = (document: RemoteInvoiceDocument): MailAttachment => ({
  filename: document.name,
  contentType: document.mime,
  content: document.content,
});

/**
 * What happens around a renewal invoice once it exists in we.publish: the
 * payment provider's side of it, the payment that lets the nightly poll see it
 * being paid, and the subscription-flow mail or letter. Shared by the nightly
 * job and the editor's renew and reactivate actions.
 */
@Injectable()
export class InvoiceDeliveryService {
  private readonly logger = new Logger('InvoiceDeliveryService');
  private readonly subscriptionEventDictionary =
    new SubscriptionEventDictionary(this.prisma);

  constructor(
    private prisma: PrismaClient,
    private mailContext: MailContext,
    private payments: PaymentsService
  ) {}

  /**
   * The nightly job's handling for an invoice an editor created by renewing or
   * reactivating a subscription. Throws when the payment provider could not
   * create its invoice; nothing is left behind then, so the editor can try
   * again.
   */
  async deliverRenewal(
    subscription: Subscription & { user: User },
    invoice: InvoiceWithItems
  ): Promise<void> {
    const creationEvent = (
      await this.subscriptionEventDictionary.getActionsForSubscriptions({
        memberplanId: subscription.memberPlanID,
        paymentMethodId: subscription.paymentMethodID,
        periodicity: subscription.paymentPeriodicity,
        autorenwal: subscription.autoRenew,
        events: [SubscriptionEvent.INVOICE_CREATION],
      })
    ).find(action => action.type === SubscriptionEvent.INVOICE_CREATION);

    if (!creationEvent) {
      throw new NotFoundException('No invoice creation found!');
    }

    const runDate = startOfDay(new Date());
    const outcome = await this.createRemoteInvoice(
      subscription,
      invoice,
      creationEvent,
      runDate
    );

    if ('skip' in outcome) {
      if (outcome.skip === 'removed') {
        throw new ServiceUnavailableException(
          `The payment provider could not create the invoice for subscription ${subscription.id}; nothing was invoiced, try again`
        );
      }

      return;
    }

    await this.sendFlowMail(
      creationEvent,
      subscription.user,
      false,
      { subscriptionToCreateInvoice: subscription, invoice },
      runDate,
      outcome.send
    );
  }

  /**
   * Have the payment provider create the invoice on its side: emailed by the
   * provider, or — for a reader in letter mode with a Swiss address, or for
   * every reader when the provider leaves delivery to we.publish — issued and
   * handed back as a pdf, printed after the invoice-creation letter or
   * attached to the invoice-creation mail. The
   * provider's invoice is kept as a payment so the nightly poll sees it being
   * paid. Nothing is left behind when the provider could not create it, not
   * even the invoice, so the next attempt starts afresh.
   */
  async createRemoteInvoice(
    subscription: Subscription & { user: User },
    invoice: Invoice & { items: InvoiceItem[] },
    creationEvent: Action,
    runDate: Date = startOfDay(new Date())
  ): Promise<RemoteInvoiceOutcome> {
    const letterRecipient = await resolveLetterRecipient({
      prisma: this.prisma,
      letterSender: this.mailContext.letterSender,
      recipient: subscription.user,
      asLetter: creationEvent.sendAsLetter,
      withPaymentSlip: true,
      logger: this.logger,
    });
    const paymentProvider =
      await this.payments.findPaymentProviderByPaymentMethodeId(
        subscription.paymentMethodID
      );

    if (!paymentProvider) {
      return { send: { letterRecipient } };
    }

    // Created first, so a provider invoice whose id could not be stored
    // afterwards still leaves a trace.
    const payment = await this.prisma.payment.create({
      data: {
        invoiceID: invoice.id,
        paymentMethodID: subscription.paymentMethodID,
        state: PaymentState.created,
      },
    });

    const weDeliver = !(await paymentProvider.deliversInvoiceItself());
    let remote: RemoteInvoiceResult | undefined;

    try {
      remote = await paymentProvider.createRemoteInvoice({
        subscription,
        invoice,
        channel: letterRecipient ? MailChannel.letter : MailChannel.mail,
      });
    } catch (error) {
      // Nothing exists at the provider. Cancelling the invoice would keep its
      // future period, which stops the nightly job from invoicing again.
      this.logger.error(
        `The payment provider could not create invoice ${invoice.id} for subscription ${subscription.id}; the invoice is removed for the next attempt: ${describeError(error)}`
      );
      await this.deleteInvoice(invoice.id);

      return { skip: 'removed' };
    }

    if (!remote) {
      // The provider keeps no invoices of its own.
      await this.prisma.payment.delete({ where: { id: payment.id } });

      return { send: { letterRecipient } };
    }

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        state: remote.intent.state,
        intentID: remote.intent.intentID,
        intentData: remote.intent.intentData,
        intentSecret: remote.intent.intentSecret,
        paymentData: remote.intent.paymentData,
      },
    });

    if (remote.deliveryError) {
      this.logger.warn(
        `The payment provider created invoice ${invoice.id} for subscription ${subscription.id} but could not deliver it: ${remote.deliveryError}`
      );
    }

    // A cover letter without the invoice is of no use to the reader, nor is
    // a cover mail when the provider does not send the invoice itself.
    if ((letterRecipient || weDeliver) && !remote.document) {
      // The letter sweep finds letter readers by their preference; a mail
      // reader is found by this entry, which also tells the editor why the
      // reader is waiting.
      if (!letterRecipient) {
        await this.recordDeferredMail(
          creationEvent,
          subscription.user,
          runDate,
          `The invoice pdf is not available yet: ${
            remote.deliveryError ?? 'the payment provider rendered none'
          }`
        );
      }

      return { skip: 'deferred' };
    }

    return {
      send: {
        letterRecipient,
        ...(remote.document && { attachment: asAttachment(remote.document) }),
      },
    };
  }

  private async recordDeferredMail(
    action: Action,
    user: User,
    runDate: Date,
    reason: string
  ) {
    if (!action.mailTemplateId) {
      return;
    }

    await new MailController(this.prisma, this.mailContext, {
      daysAwayFromEnding: action.daysAwayFromEnding,
      mailTemplateId: action.mailTemplateId,
      recipient: user,
      periodicJobRunDate: runDate,
      optionalData: {},
      mailType: mailLogType.SubscriptionFlow,
    }).recordDeferred(reason);
  }

  /** Remove an invoice nothing was paid on, with everything hanging off it. */
  private async deleteInvoice(invoiceId: string) {
    await this.prisma.$transaction([
      this.prisma.payment.deleteMany({ where: { invoiceID: invoiceId } }),
      this.prisma.subscriptionPeriod.deleteMany({
        where: { invoiceID: invoiceId },
      }),
      this.prisma.invoiceItem.deleteMany({ where: { invoiceId } }),
      this.prisma.invoice.delete({ where: { id: invoiceId } }),
    ]);
  }

  /** Whether any payment provider leaves delivering its invoices to we.publish. */
  async anyProviderLeavesDeliveryToUs(): Promise<boolean> {
    for (const provider of this.payments.getProviders()) {
      if (!(await provider.deliversInvoiceItself())) {
        return true;
      }
    }

    return false;
  }

  /**
   * Whether the provider behind an invoice left delivering it to we.publish.
   * No for an invoice that never reached a provider.
   */
  async leavesDeliveryToUs(invoice: Invoice): Promise<boolean> {
    const payments = await this.payments.findByInvoiceId(invoice.id);
    const payment = payments.find(({ intentID }) => intentID);

    if (!payment) {
      return false;
    }

    const paymentProvider =
      await this.payments.findPaymentProviderByPaymentMethodeId(
        payment.paymentMethodID
      );

    return paymentProvider ?
        !(await paymentProvider.deliversInvoiceItself())
      : false;
  }

  /**
   * The provider's pdf of the invoice it created earlier, found through the
   * payment that holds its id. Nothing for an invoice that never reached a
   * provider; throws when the provider cannot render it right now.
   */
  async renderRemoteInvoice(
    invoice: Invoice
  ): Promise<MailAttachment | undefined> {
    const payments = await this.payments.findByInvoiceId(invoice.id);
    const payment = payments.find(({ intentID }) => intentID);

    if (!payment) {
      return undefined;
    }

    const paymentProvider =
      await this.payments.findPaymentProviderByPaymentMethodeId(
        payment.paymentMethodID
      );
    const document = await paymentProvider?.renderRemoteInvoice({ payment });

    return document && asAttachment(document);
  }

  /**
   * Send a subscription-flow template as mail or, for a reader in letter mode,
   * as a letter. A refused address or a print vendor outage concerns this
   * recipient only and is logged; anything else is thrown.
   */
  async sendFlowMail(
    action: Action,
    user: User,
    isRetry: boolean,
    optionalData: Record<string, any>,
    periodicJobRunDate: Date,
    delivery: DeliverySide = {}
  ) {
    if (!action.mailTemplateId || !user) {
      return;
    }

    try {
      await new MailController(this.prisma, this.mailContext, {
        daysAwayFromEnding: action.daysAwayFromEnding,
        mailTemplateId: action.mailTemplateId,
        recipient: user,
        isRetry,
        optionalData,
        periodicJobRunDate,
        mailType: mailLogType.SubscriptionFlow,
        asLetter: action.sendAsLetter,
        ...delivery,
      }).sendMail();
    } catch (error) {
      // A refused address, a print vendor outage or attachments that cannot
      // be rendered concern this recipient only; the run goes on with the
      // others. The mail log keeps the reason.
      if (
        !(error instanceof MailProviderRecipientError) &&
        !(error instanceof LetterDeliveryError) &&
        !(error instanceof MailAttachmentError)
      ) {
        throw error;
      }

      this.logger.warn(
        `Skipping mail to ${user.email}: ${(error as Error).message}`
      );
    }
  }
}
