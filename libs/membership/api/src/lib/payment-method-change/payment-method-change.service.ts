import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  PaymentMethodChangeKind,
  PaymentMethodChangeState,
  PaymentState,
  PrismaClient,
  SubscriptionPaymentMethodChange,
} from '@prisma/client';
import { add } from 'date-fns';
import {
  AuthorizationState,
  InvoicePaidListener,
  InvoicePaidNotifier,
  isPaymentMethodRetired,
  PaymentAuthorizationListener,
  PaymentAuthorizationNotifier,
  PaymentProvider,
  PaymentsService,
} from '@wepublish/payment/api';
import { SettingName, SettingsService } from '@wepublish/settings/api';
import { MemberContextService } from '../legacy/member-context.service';

/** Used when the PAYMENT_METHOD_CHANGE_EXPIRY_DAYS setting has no value. */
const DEFAULT_EXPIRY_DAYS = 14;

export type StartPaymentMethodChangeProps = {
  subscriptionId: string;
  paymentMethodId: string;
  successURL?: string;
  failureURL?: string;
};

export type StartedPaymentMethodChange = {
  change: SubscriptionPaymentMethodChange;
  /** Where the reader pays or authorizes: a redirect URL or Stripe secret. */
  intentSecret?: string;
  paymentProviderID: string;
};

/**
 * Moves a subscription to another payment method. The subscription keeps its
 * current payment method until the reader has proven the new one:
 *
 * - with an open invoice, by paying it with the new payment method;
 * - otherwise, by authorizing the new payment method without being charged
 *   (a Stripe SetupIntent, or a small hold that is released again);
 * - a payment method that is not charged off session (e.g. invoice) needs no
 *   proof and applies straight away.
 */
@Injectable()
export class PaymentMethodChangeService
  implements InvoicePaidListener, PaymentAuthorizationListener, OnModuleInit
{
  private logger = new Logger('PaymentMethodChangeService');

  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService,
    private memberContext: MemberContextService,
    private settings: SettingsService,
    private invoicePaidNotifier: InvoicePaidNotifier,
    private authorizationNotifier: PaymentAuthorizationNotifier
  ) {}

  onModuleInit() {
    this.invoicePaidNotifier.register(this);
    this.authorizationNotifier.register(this);
  }

  async start(
    userId: string,
    {
      subscriptionId,
      paymentMethodId,
      successURL,
      failureURL,
    }: StartPaymentMethodChangeProps
  ): Promise<StartedPaymentMethodChange> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        memberPlan: { include: { availablePaymentMethods: true } },
        deactivation: true,
        user: true,
      },
    });

    if (!subscription || subscription.userID !== userId) {
      throw new BadRequestException(`Subscription ${subscriptionId} not found`);
    }

    if (subscription.deactivation) {
      throw new BadRequestException(
        `Subscription ${subscription.id} is deactivated`
      );
    }

    const currentProvider = await this.providerOfPaymentMethod(
      subscription.paymentMethodID
    );

    if (currentProvider?.remoteManagedSubscription) {
      throw new BadRequestException(
        `The payment method of subscription ${subscription.id} is managed by its payment provider`
      );
    }

    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId, active: true },
    });

    if (!paymentMethod) {
      throw new NotFoundException('PaymentMethod', paymentMethodId);
    }

    if (await isPaymentMethodRetired(this.prisma, paymentMethod)) {
      throw new BadRequestException(
        `PaymentMethod ${paymentMethod.id} is no longer offered`
      );
    }

    const provider = this.payments.findById(paymentMethod.paymentProviderID);

    if (!provider || provider.remoteManagedSubscription) {
      throw new BadRequestException(
        `PaymentMethod ${paymentMethod.id} cannot be switched to`
      );
    }

    await this.memberContext.validateSubscriptionPaymentConfiguration(
      subscription.memberPlan,
      subscription.autoRenew,
      subscription.paymentPeriodicity,
      paymentMethod.id
    );

    const openInvoice = await this.prisma.invoice.findFirst({
      where: {
        subscriptionID: subscription.id,
        paidAt: null,
        canceledAt: null,
      },
      include: { items: true },
      orderBy: { dueAt: 'asc' },
    });
    const offSession = await provider.isOffSession();

    const kind =
      openInvoice ? PaymentMethodChangeKind.invoicePayment
      : offSession ? PaymentMethodChangeKind.authorization
      : PaymentMethodChangeKind.immediate;

    if (
      kind === PaymentMethodChangeKind.authorization &&
      !provider.supportsAuthorization()
    ) {
      throw new BadRequestException(
        `PaymentMethod ${paymentMethod.id} cannot be authorized without a payment`
      );
    }

    // The same payment method again only makes sense when a new token comes
    // out of it, e.g. a new card for the same provider.
    if (paymentMethod.id === subscription.paymentMethodID && !offSession) {
      throw new BadRequestException(
        `Subscription ${subscription.id} already uses PaymentMethod ${paymentMethod.id}`
      );
    }

    await this.cancelPending(subscription.id);

    const change = await this.prisma.subscriptionPaymentMethodChange.create({
      data: {
        kind,
        state:
          kind === PaymentMethodChangeKind.immediate ?
            PaymentMethodChangeState.completed
          : PaymentMethodChangeState.pending,
        subscriptionID: subscription.id,
        fromPaymentMethodID: subscription.paymentMethodID,
        paymentMethodID: paymentMethod.id,
        currency: openInvoice?.currency ?? subscription.currency,
        expiresAt: add(new Date(), { days: await this.expiryDays() }),
        ...(kind === PaymentMethodChangeKind.immediate ?
          { completedAt: new Date() }
        : {}),
      },
    });

    if (kind === PaymentMethodChangeKind.immediate) {
      await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: { paymentMethodID: paymentMethod.id },
      });

      return { change, paymentProviderID: provider.id };
    }

    try {
      if (openInvoice) {
        // Without the stored customer, so the reader goes through the
        // checkout of the new payment method and it gets stored for renewals.
        const payment = await this.payments.createPaymentWithProvider({
          invoice: openInvoice,
          paymentMethodID: paymentMethod.id,
          saveCustomer: true,
          successURL,
          failureURL,
        });

        const updated =
          await this.prisma.subscriptionPaymentMethodChange.update({
            where: { id: change.id },
            data: { paymentID: payment.id },
          });

        return {
          // a payment that was paid right away already completed the change
          change:
            payment.state === PaymentState.paid ?
              ((await this.prisma.subscriptionPaymentMethodChange.findUnique({
                where: { id: change.id },
              })) ?? updated)
            : updated,
          intentSecret: payment.intentSecret ?? undefined,
          paymentProviderID: provider.id,
        };
      }

      const customer = await this.prisma.paymentProviderCustomer.findFirst({
        where: { userId, paymentProviderID: provider.id },
      });

      const intent = await provider.createAuthorizationIntent({
        changeID: change.id,
        currency: change.currency,
        customerID: customer?.customerID,
        email: subscription.user.email,
        successURL,
        failureURL,
      });

      const updated = await this.prisma.subscriptionPaymentMethodChange.update({
        where: { id: change.id },
        data: {
          intentID: intent.intentID,
          intentSecret: intent.intentSecret,
          intentData: intent.intentData,
          amount: intent.amount,
          ...(intent.state === 'failed' ?
            { state: PaymentMethodChangeState.failed }
          : {}),
        },
      });

      return {
        change: updated,
        intentSecret: intent.intentSecret,
        paymentProviderID: provider.id,
      };
    } catch (error) {
      await this.prisma.subscriptionPaymentMethodChange.update({
        where: { id: change.id },
        data: { state: PaymentMethodChangeState.failed },
      });

      throw error;
    }
  }

  /**
   * Asks the provider for the outcome, for when the reader is back before the
   * webhook arrived.
   */
  async check(userId: string, changeId: string) {
    const change = await this.findOwnChange(userId, changeId);

    if (change.state !== PaymentMethodChangeState.pending) {
      return change;
    }

    const provider = await this.providerOfPaymentMethod(change.paymentMethodID);

    if (!provider) {
      return change;
    }

    if (change.kind === PaymentMethodChangeKind.authorization) {
      if (change.intentID) {
        const state = await provider.checkAuthorizationStatus({
          intentID: change.intentID,
          changeID: change.id,
        });

        if (state) {
          await this.applyAuthorization(provider, change, state);
        }
      }
    } else if (change.paymentID) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: change.paymentID },
      });

      if (payment?.intentID && payment.state !== PaymentState.paid) {
        const intentState = await provider.checkIntentStatus({
          intentID: payment.intentID,
          paymentID: payment.id,
        });

        if (intentState) {
          await provider.updatePaymentWithIntentState({ intentState });

          if (intentState.state === PaymentState.paid) {
            await this.invoicePaidNotifier.notify(payment.invoiceID);
          }
        }
      }
    }

    return this.findOwnChange(userId, changeId);
  }

  async cancel(userId: string, changeId: string) {
    const change = await this.findOwnChange(userId, changeId);

    if (change.state === PaymentMethodChangeState.pending) {
      await this.endPending(change, PaymentMethodChangeState.canceled);
    }

    return this.findOwnChange(userId, changeId);
  }

  /**
   * Whether a subscription with this payment method can renew it, e.g. with a
   * new card: only when renewals are charged automatically with a token the
   * reader can authorize anew.
   */
  async canRenew(paymentMethodId: string): Promise<boolean> {
    const provider = await this.providerOfPaymentMethod(paymentMethodId);

    return (
      !!provider &&
      !provider.remoteManagedSubscription &&
      provider.supportsAuthorization() &&
      (await provider.isOffSession())
    );
  }

  /** The pending change of a subscription, if there is one. */
  async findPending(subscriptionId: string) {
    return this.prisma.subscriptionPaymentMethodChange.findFirst({
      where: {
        subscriptionID: subscriptionId,
        state: PaymentMethodChangeState.pending,
      },
    });
  }

  async onInvoicePaid(invoiceId: string): Promise<void> {
    const change = await this.prisma.subscriptionPaymentMethodChange.findFirst({
      where: {
        state: PaymentMethodChangeState.pending,
        kind: PaymentMethodChangeKind.invoicePayment,
        payment: { invoiceID: invoiceId },
      },
    });

    if (!change?.paymentID) {
      return;
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: change.paymentID },
    });

    if (payment?.state === PaymentState.paid) {
      await this.complete(change);
      return;
    }

    // Paid some other way (e.g. marked as paid by an admin): the new payment
    // method was never proven, so the reader has to start over.
    await this.endPending(change, PaymentMethodChangeState.failed);
  }

  async onAuthorization(
    paymentProviderID: string,
    state: AuthorizationState
  ): Promise<void> {
    const change = await this.prisma.subscriptionPaymentMethodChange.findUnique(
      {
        where: { id: state.changeID },
      }
    );

    if (!change || change.state !== PaymentMethodChangeState.pending) {
      return;
    }

    const provider = await this.providerOfPaymentMethod(change.paymentMethodID);

    if (provider?.id !== paymentProviderID) {
      this.logger.warn(
        `Ignoring authorization of change ${change.id} reported by ${paymentProviderID}`
      );
      return;
    }

    await this.applyAuthorization(provider, change, state);
  }

  /** Ends pending changes nobody finished in time; returns how many. */
  async expirePending(runDate: Date = new Date()): Promise<number> {
    const changes = await this.prisma.subscriptionPaymentMethodChange.findMany({
      where: {
        state: PaymentMethodChangeState.pending,
        expiresAt: { lte: runDate },
      },
    });

    for (const change of changes) {
      await this.endPending(change, PaymentMethodChangeState.expired);
    }

    return changes.length;
  }

  private async applyAuthorization(
    provider: PaymentProvider,
    change: SubscriptionPaymentMethodChange,
    state: AuthorizationState
  ) {
    if (state.state === 'failed') {
      await this.endPending(change, PaymentMethodChangeState.failed);
      return;
    }

    if (state.state === 'processing' || !state.customerID) {
      if (state.state === 'authorized') {
        this.logger.warn(
          `Authorization of change ${change.id} has no token, still waiting`
        );
      }
      return;
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { id: change.subscriptionID },
    });

    if (!subscription) {
      return;
    }

    // stored first, so the subscription never switches to a payment method
    // renewals cannot be charged with
    await provider.saveCustomer(subscription.userID, state.customerID);

    if (await this.complete(change)) {
      await this.release(provider, change);
    }
  }

  /** Switches the subscription; false when the change was already ended. */
  private async complete(change: SubscriptionPaymentMethodChange) {
    const { count } =
      await this.prisma.subscriptionPaymentMethodChange.updateMany({
        where: { id: change.id, state: PaymentMethodChangeState.pending },
        data: {
          state: PaymentMethodChangeState.completed,
          completedAt: new Date(),
        },
      });

    if (!count) {
      return false;
    }

    await this.prisma.subscription.update({
      where: { id: change.subscriptionID },
      data: { paymentMethodID: change.paymentMethodID },
    });

    return true;
  }

  private async cancelPending(subscriptionId: string) {
    const pending = await this.prisma.subscriptionPaymentMethodChange.findMany({
      where: {
        subscriptionID: subscriptionId,
        state: PaymentMethodChangeState.pending,
      },
    });

    for (const change of pending) {
      await this.endPending(change, PaymentMethodChangeState.canceled);
    }
  }

  private async endPending(
    change: SubscriptionPaymentMethodChange,
    state: PaymentMethodChangeState
  ) {
    const { count } =
      await this.prisma.subscriptionPaymentMethodChange.updateMany({
        where: { id: change.id, state: PaymentMethodChangeState.pending },
        data: { state },
      });

    if (count) {
      const provider = await this.providerOfPaymentMethod(
        change.paymentMethodID
      );

      if (provider) {
        await this.release(provider, change);
      }
    }
  }

  /** The hold is never captured; a failed release lapses on its own. */
  private async release(
    provider: PaymentProvider,
    change: SubscriptionPaymentMethodChange
  ) {
    if (
      change.kind !== PaymentMethodChangeKind.authorization ||
      !change.intentID
    ) {
      return;
    }

    try {
      await provider.releaseAuthorization({ intentID: change.intentID });
    } catch (error) {
      this.logger.error(
        `Could not release the authorization of change ${change.id}: ${(error as Error).message}`
      );
    }
  }

  private async findOwnChange(userId: string, changeId: string) {
    const change = await this.prisma.subscriptionPaymentMethodChange.findUnique(
      {
        where: { id: changeId },
      }
    );
    const subscription =
      change &&
      (await this.prisma.subscription.findUnique({
        where: { id: change.subscriptionID },
      }));

    if (!change || subscription?.userID !== userId) {
      throw new NotFoundException('SubscriptionPaymentMethodChange', changeId);
    }

    return change;
  }

  private async providerOfPaymentMethod(paymentMethodId: string) {
    const paymentMethod = await this.prisma.paymentMethod.findUnique({
      where: { id: paymentMethodId },
    });

    return paymentMethod ?
        this.payments.findById(paymentMethod.paymentProviderID)
      : undefined;
  }

  private async expiryDays() {
    try {
      const setting = await this.settings.settingByName(
        SettingName.PAYMENT_METHOD_CHANGE_EXPIRY_DAYS
      );

      if (typeof setting?.value === 'number' && setting.value > 0) {
        return setting.value;
      }
    } catch {
      return DEFAULT_EXPIRY_DAYS;
    }

    return DEFAULT_EXPIRY_DAYS;
  }
}
