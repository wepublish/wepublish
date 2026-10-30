import { BadRequestException, Injectable } from '@nestjs/common';
import {
  Currency,
  Payment,
  Prisma,
  PrismaClient,
  SellableKind,
} from '@prisma/client';
import { addDays } from 'date-fns';
import { PaymentsService } from '../payments.service';
import { SellableInvoice, SellableLineDraft } from './sellable-handler';

const MAX_ATTEMPTS = 5;
const DEFAULT_UNPAID_CANCEL_AFTER_DAYS = 14;

export interface SellableCheckoutInput {
  userId: string;
  mail: string;
  currency: Currency;
  description: string;
  kind: SellableKind;
  lines: SellableLineDraft[];
  paymentMethodId: string;
  successURL?: string;
  failureURL?: string;
  unpaidCancelAfterDays?: number;
}

export interface SellableCheckoutResult {
  invoice: SellableInvoice;
  payment: Payment;
}

const isUniqueViolation = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  error.code === 'P2002';

@Injectable()
export class SellableCheckoutService {
  constructor(
    private prisma: PrismaClient,
    private payments: PaymentsService
  ) {}

  async checkout(
    input: SellableCheckoutInput
  ): Promise<SellableCheckoutResult> {
    this.assertLines(input.lines);
    await this.payments.assertStandalonePaymentMethod(input.paymentMethodId);

    const invoice = await this.createInvoice(input);
    const payment = await this.payments.createStandaloneInvoicePayment({
      invoice,
      paymentMethodID: input.paymentMethodId,
      successURL: input.successURL,
      failureURL: input.failureURL,
    });

    return { invoice, payment };
  }

  private assertLines(lines: SellableLineDraft[]) {
    if (!lines.length) {
      throw new BadRequestException('Checkout needs at least one line');
    }

    for (const { amount, quantity } of lines) {
      if (!Number.isInteger(amount) || amount < 0) {
        throw new BadRequestException(
          'Line amounts must be non-negative integers'
        );
      }

      if (!Number.isInteger(quantity) || quantity < 1) {
        throw new BadRequestException('Line quantities must be at least 1');
      }
    }
  }

  private async createInvoice({
    userId,
    mail,
    currency,
    description,
    kind,
    lines,
    unpaidCancelAfterDays,
  }: SellableCheckoutInput): Promise<SellableInvoice> {
    for (let attempt = 1; ; attempt++) {
      try {
        return await this.prisma.$transaction(async tx => {
          const now = new Date();
          const invoice = await tx.invoice.create({
            data: {
              userID: userId,
              mail,
              currency,
              description,
              dueAt: now,
              scheduledDeactivationAt: addDays(
                now,
                unpaidCancelAfterDays ?? DEFAULT_UNPAID_CANCEL_AFTER_DAYS
              ),
              subscriptionID: null,
              sellableKind: kind,
            },
          });

          for (const line of lines) {
            const item = await tx.invoiceItem.create({
              data: {
                invoiceId: invoice.id,
                name: line.name,
                description: line.description,
                amount: line.amount,
                quantity: line.quantity,
                discountCodeId: line.discountCodeId,
              },
            });

            await line.attach(tx, item);
          }

          return tx.invoice.findUniqueOrThrow({
            where: { id: invoice.id },
            include: { items: true },
          });
        });
      } catch (error) {
        if (attempt >= MAX_ATTEMPTS || !isUniqueViolation(error)) {
          throw error;
        }
      }
    }
  }
}
