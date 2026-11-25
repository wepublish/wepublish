import { Invoice, InvoiceItem, Prisma, SellableKind } from '@prisma/client';

export type SellableInvoice = Invoice & { items: InvoiceItem[] };

export enum SellableRevokeReason {
  chargeback = 'chargeback',
  invoiceCanceled = 'invoiceCanceled',
}

export interface SellableHandler {
  readonly kind: SellableKind;
  fulfil(item: InvoiceItem, invoice: SellableInvoice): Promise<void>;
  revoke(
    item: InvoiceItem,
    invoice: SellableInvoice,
    reason: SellableRevokeReason
  ): Promise<void>;
  isAvailable?(): Promise<boolean>;
  allowedPaymentMethodIds?(
    item: InvoiceItem,
    invoice: SellableInvoice
  ): Promise<string[] | undefined>;
}

export type SellableLineDraft = {
  name: string;
  description?: string;
  amount: number;
  quantity: number;
  discountCodeId?: string;
  attach(tx: Prisma.TransactionClient, item: InvoiceItem): Promise<void>;
};
