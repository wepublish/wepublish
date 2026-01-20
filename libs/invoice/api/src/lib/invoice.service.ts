import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PaymentsService } from '@wepublish/payment/api';

@Injectable()
export class InvoiceService {
  constructor(
    private prisma: PrismaClient,
    private paymentsService: PaymentsService
  ) {}

  async getInvoicesByUser(userId: string) {
    return this.prisma.invoice.findMany({
      where: {
        subscription: {
          userID: userId,
        },
      },
      include: {
        items: true,
      },
    });
  }

  async checkInvoiceStatus(id: string, userId: string) {
    const paymentProviders = this.paymentsService.getProviders();

    const invoice = await this.prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
      },
    });

    if (!invoice || !invoice.subscriptionID) {
      throw new NotFoundException(`Invoice with id ${id} was not found`);
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: {
        id: invoice.subscriptionID,
      },
    });

    if (!subscription || subscription.userID !== userId) {
      throw new NotFoundException(`Invoice with ${id} was not found`);
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        invoiceID: invoice.id,
      },
    });
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: {
        active: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    for (const payment of payments) {
      if (!payment || !payment.intentID) continue;

      const paymentMethod = paymentMethods.find(
        pm => pm.id === payment.paymentMethodID
      );
      if (!paymentMethod) continue; // TODO: what happens if we don't find a paymentMethod

      const paymentProvider = paymentProviders.find(
        pp => pp.id === paymentMethod.paymentProviderID
      );
      if (!paymentProvider) continue; // TODO: what happens if we don't find a paymentProvider

      const intentState = await paymentProvider.checkIntentStatus({
        intentID: payment.intentID,
        paymentID: payment.id,
      });
      await paymentProvider.updatePaymentWithIntentState({
        intentState,
      });
    }

    // FIXME: We need to implement a way to wait for all the database
    //  event hooks to finish before we return data. Will be solved in WPC-498
    await new Promise(resolve => setTimeout(resolve, 100));

    return await this.prisma.invoice.findUnique({
      where: {
        id,
      },
      include: {
        items: true,
      },
    });
  }
}
