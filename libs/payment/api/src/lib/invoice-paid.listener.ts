import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

export interface InvoicePaidListener {
  onInvoicePaid(invoiceId: string): Promise<void>;
}

export const INVOICE_PAID_LISTENER = Symbol('INVOICE_PAID_LISTENER');

@Injectable()
export class InvoicePaidNotifier {
  private logger = new Logger('InvoicePaidNotifier');
  private registered: InvoicePaidListener[] = [];

  constructor(
    @Optional()
    @Inject(INVOICE_PAID_LISTENER)
    private listener?: InvoicePaidListener
  ) {}

  /** Adds a listener besides the one bound to INVOICE_PAID_LISTENER. */
  public register(listener: InvoicePaidListener) {
    this.registered.push(listener);
  }

  public async notify(invoiceId: string): Promise<void> {
    const listeners = [
      ...(this.listener ? [this.listener] : []),
      ...this.registered,
    ];

    for (const listener of listeners) {
      try {
        await listener.onInvoicePaid(invoiceId);
      } catch (error) {
        this.logger.error(
          `Invoice paid listener failed for invoice ${invoiceId}: ${(error as Error).message}`
        );
      }
    }
  }
}
