import { Inject, Injectable, Logger, Optional } from '@nestjs/common';

export interface InvoicePaidListener {
  onInvoicePaid(invoiceId: string): Promise<void>;
}

export const INVOICE_PAID_LISTENER = Symbol('INVOICE_PAID_LISTENER');

@Injectable()
export class InvoicePaidNotifier {
  private logger = new Logger('InvoicePaidNotifier');

  constructor(
    @Optional()
    @Inject(INVOICE_PAID_LISTENER)
    private listener?: InvoicePaidListener
  ) {}

  public async notify(invoiceId: string): Promise<void> {
    if (!this.listener) {
      return;
    }

    try {
      await this.listener.onInvoicePaid(invoiceId);
    } catch (error) {
      this.logger.error(
        `Invoice paid listener failed for invoice ${invoiceId}: ${(error as Error).message}`
      );
    }
  }
}
