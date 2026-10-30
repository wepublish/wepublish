import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InvoiceItem, PaymentState, PrismaClient } from '@prisma/client';
import { describeError } from '@wepublish/utils/api';
import {
  InvoicePaidListener,
  InvoicePaidNotifier,
} from '../invoice-paid.listener';
import { SellableInvoice, SellableRevokeReason } from './sellable-handler';
import { isSellableInvoice } from './sellable-invoice';
import { SellableRegistry } from './sellable-registry.service';

type Marker = 'fulfilledAt' | 'revokedAt';

type ItemFailure = { itemId: string; error: unknown };

export class SellableFulfilmentError extends Error {
  constructor(
    public readonly errors: unknown[],
    message: string
  ) {
    super(message);
    this.name = 'SellableFulfilmentError';
  }
}

@Injectable()
export class SellableFulfilmentService
  implements InvoicePaidListener, OnModuleInit
{
  private logger = new Logger('SellableFulfilmentService');

  constructor(
    private prisma: PrismaClient,
    private registry: SellableRegistry,
    private notifier: InvoicePaidNotifier
  ) {}

  onModuleInit() {
    this.notifier.register(this);
  }

  async onInvoicePaid(invoiceId: string): Promise<void> {
    await this.reconcileInvoice(invoiceId);
  }

  async reconcileInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: true },
    });

    if (
      !invoice?.sellableKind ||
      !isSellableInvoice(invoice) ||
      !invoice.items.length
    ) {
      return;
    }

    const handler = this.registry.get(invoice.sellableKind);

    if (!handler) {
      this.logger.warn(
        `No sellable handler registered for ${invoice.sellableKind}, the items of invoice ${invoiceId} stay unmarked`
      );
      return;
    }

    const failures: ItemFailure[] = [];

    if (invoice.paidAt && !invoice.canceledAt) {
      for (const item of invoice.items) {
        if (item.fulfilledAt || item.revokedAt) {
          continue;
        }

        await this.runAndMark(item, 'fulfilledAt', failures, () =>
          handler.fulfil(item, invoice)
        );
      }
    } else if (invoice.canceledAt && !invoice.paidAt) {
      let reason: SellableRevokeReason | undefined;

      for (const item of invoice.items) {
        if (item.revokedAt) {
          continue;
        }

        await this.runAndMark(item, 'revokedAt', failures, async () => {
          reason ??= await this.revokeReason(invoice);
          await handler.revoke(item, invoice, reason);
        });
      }
    }

    if (failures.length) {
      throw new SellableFulfilmentError(
        failures.map(({ error }) => error),
        `Fulfilment of sellable invoice ${invoiceId} failed: ${failures
          .map(({ itemId, error }) => `item ${itemId}: ${describeError(error)}`)
          .join('; ')}`
      );
    }
  }

  private async runAndMark(
    item: InvoiceItem,
    marker: Marker,
    failures: ItemFailure[],
    run: () => Promise<void>
  ) {
    try {
      await run();
      await this.prisma.invoiceItem.updateMany({
        where:
          marker === 'fulfilledAt' ?
            { id: item.id, fulfilledAt: null, revokedAt: null }
          : { id: item.id, revokedAt: null },
        data: { [marker]: new Date() },
      });
    } catch (error) {
      failures.push({ itemId: item.id, error });
    }
  }

  private async revokeReason(
    invoice: SellableInvoice
  ): Promise<SellableRevokeReason> {
    const chargebacks = await this.prisma.payment.count({
      where: { invoiceID: invoice.id, state: PaymentState.chargeback },
    });

    return chargebacks > 0 ?
        SellableRevokeReason.chargeback
      : SellableRevokeReason.invoiceCanceled;
  }
}
