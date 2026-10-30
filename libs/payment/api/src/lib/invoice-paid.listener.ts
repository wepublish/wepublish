import { Injectable, Logger } from '@nestjs/common';
import { describeError } from '@wepublish/utils/api';

export interface InvoicePaidListener {
  onInvoicePaid(invoiceId: string): Promise<void>;
}

@Injectable()
export class InvoicePaidNotifier {
  private logger = new Logger('InvoicePaidNotifier');
  private listeners: InvoicePaidListener[] = [];

  public register(listener: InvoicePaidListener): void {
    if (this.listeners.includes(listener)) {
      return;
    }

    this.listeners.push(listener);
  }

  public async notify(invoiceId: string): Promise<void> {
    for (const listener of this.listeners) {
      try {
        await listener.onInvoicePaid(invoiceId);
      } catch (error) {
        this.logger.error(
          `Invoice paid listener failed for invoice ${invoiceId}: ${describeError(error)}`
        );
      }
    }
  }
}
