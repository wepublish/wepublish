import { Logger } from '@nestjs/common';
import { PaymentState, PrismaClient, SellableKind } from '@prisma/client';

type SellablePrisma = Pick<PrismaClient, 'invoice'>;

export type SellableSettlement = 'paid' | 'chargedBack' | 'unchanged';

const logger = new Logger('SellableInvoice');

export function isSellableInvoice(invoice: {
  subscriptionID: string | null;
  sellableKind: SellableKind | null;
}): boolean {
  return !invoice.subscriptionID && !!invoice.sellableKind;
}

export async function settleSellableInvoice(
  prisma: SellablePrisma,
  invoiceId: string,
  state: PaymentState,
  opts: { manuallySetAsPaidByUserId?: string } = {}
): Promise<SellableSettlement> {
  if (state === PaymentState.paid) {
    const { count } = await prisma.invoice.updateMany({
      where: { id: invoiceId, paidAt: null, canceledAt: null },
      data: { paidAt: new Date(), ...opts },
    });

    if (count > 0) {
      return 'paid';
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (invoice?.canceledAt) {
      logger.warn(`payment received for canceled invoice ${invoiceId}`);
    }

    return 'unchanged';
  }

  if (state === PaymentState.chargeback) {
    const { count } = await prisma.invoice.updateMany({
      where: { id: invoiceId, canceledAt: null },
      data: { paidAt: null, canceledAt: new Date() },
    });

    return count > 0 ? 'chargedBack' : 'unchanged';
  }

  return 'unchanged';
}

export function sellableTotal(
  items: ReadonlyArray<{ amount: number; quantity: number }>
): number {
  return items.reduce(
    (total, { amount, quantity }) => total + amount * quantity,
    0
  );
}
