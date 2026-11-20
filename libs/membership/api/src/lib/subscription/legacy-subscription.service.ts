import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  InvoicePaidListener,
  InvoicePaidNotifier,
} from '@wepublish/payment/api';

import { legacySubscriptionWhere } from './legacy-subscription';

/**
 * Ends the legacy state of an imported subscription with the first payment
 * registered here. Registered listeners run after the renewal mail, so that
 * mail still comes from the legacy flow.
 */
@Injectable()
export class LegacySubscriptionService
  implements InvoicePaidListener, OnModuleInit
{
  constructor(
    private prisma: PrismaClient,
    private invoicePaidNotifier: InvoicePaidNotifier
  ) {}

  onModuleInit() {
    this.invoicePaidNotifier.register(this);
  }

  async onInvoicePaid(invoiceId: string): Promise<void> {
    await this.prisma.subscription.updateMany({
      where: {
        invoices: { some: { id: invoiceId } },
        ...legacySubscriptionWhere(true),
      },
      data: { legacyEndedAt: new Date() },
    });
  }
}
