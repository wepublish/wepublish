import { Injectable, Logger } from '@nestjs/common';
import { PaymentState, Prisma, PrismaClient } from '@prisma/client';
import { describeError } from '@wepublish/utils/api';
import { subDays, subMinutes } from 'date-fns';
import { InvoicePaidNotifier } from '../invoice-paid.listener';
import { PaymentsService } from '../payments.service';

const BATCH_SIZE = 500;
const POLL_WINDOW_DAYS = 30;
const POLL_GRACE_MINUTES = 10;
const RESYNC_WINDOW_DAYS = 90;

const PENDING_PAYMENT_STATES = [
  PaymentState.created,
  PaymentState.submitted,
  PaymentState.processing,
  PaymentState.requiresUserAction,
];

const openSellableInvoice = {
  subscriptionID: null,
  sellableKind: { not: null },
  paidAt: null,
  canceledAt: null,
} satisfies Prisma.InvoiceWhereInput;

export interface SellableReconciliationResult {
  polled: number;
  canceled: number;
  resynced: number;
  failed: number;
}

@Injectable()
export class SellableReconciliationService {
  private logger = new Logger('SellableReconciliationService');

  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService,
    private notifier: InvoicePaidNotifier
  ) {}

  async reconcile(now = new Date()): Promise<SellableReconciliationResult> {
    const result: SellableReconciliationResult = {
      polled: 0,
      canceled: 0,
      resynced: 0,
      failed: 0,
    };

    await this.forEachInvoice(
      'poll',
      {
        ...openSellableInvoice,
        createdAt: {
          gte: subDays(now, POLL_WINDOW_DAYS),
          lte: subMinutes(now, POLL_GRACE_MINUTES),
        },
      },
      result,
      async id => {
        await this.pollPendingPayments(id);
        await this.notifier.notify(id);
        result.polled++;
      }
    );

    await this.forEachInvoice(
      'cancel',
      { ...openSellableInvoice, scheduledDeactivationAt: { lte: now } },
      result,
      async id => {
        const { count } = await this.prisma.invoice.updateMany({
          where: { id, paidAt: null, canceledAt: null },
          data: { canceledAt: now },
        });
        await this.notifier.notify(id);

        if (count > 0) {
          result.canceled++;
        }
      }
    );

    await this.forEachInvoice(
      'resync',
      {
        createdAt: { gte: subDays(now, RESYNC_WINDOW_DAYS) },
        subscriptionID: null,
        sellableKind: { not: null },
        OR: [
          {
            paidAt: { not: null },
            canceledAt: null,
            items: { some: { fulfilledAt: null, revokedAt: null } },
          },
          {
            paidAt: null,
            canceledAt: { not: null },
            items: { some: { revokedAt: null } },
          },
        ],
      },
      result,
      async id => {
        await this.notifier.notify(id);
        result.resynced++;
      }
    );

    return result;
  }

  private async forEachInvoice(
    step: string,
    where: Prisma.InvoiceWhereInput,
    result: SellableReconciliationResult,
    run: (invoiceId: string) => Promise<void>
  ) {
    let invoices: { id: string }[];

    try {
      invoices = await this.prisma.invoice.findMany({
        where,
        select: { id: true },
        take: BATCH_SIZE,
      });
    } catch (error) {
      result.failed++;
      this.logger.error(
        `Sellable reconciliation step ${step} could not load invoices: ${describeError(error)}`
      );
      return;
    }

    for (const { id } of invoices) {
      try {
        await run(id);
      } catch (error) {
        result.failed++;
        this.logger.error(
          `Sellable reconciliation step ${step} failed for invoice ${id}: ${describeError(error)}`
        );
      }
    }
  }

  private async pollPendingPayments(invoiceID: string) {
    const payments = await this.prisma.payment.findMany({
      where: {
        invoiceID,
        intentID: { not: null },
        state: { in: PENDING_PAYMENT_STATES },
      },
    });

    for (const payment of payments) {
      const provider =
        await this.payments.findPaymentProviderByPaymentMethodeId(
          payment.paymentMethodID
        );

      if (!provider || !payment.intentID) {
        continue;
      }

      const intentState = await provider.checkIntentStatus({
        intentID: payment.intentID,
        paymentID: payment.id,
      });

      if (intentState) {
        await provider.updatePaymentWithIntentState({ intentState });
      }
    }
  }
}
