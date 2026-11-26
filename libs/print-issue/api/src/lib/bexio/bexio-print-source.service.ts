import { Injectable } from '@nestjs/common';
import { BexioPaymentProvider, PaymentsService } from '@wepublish/payment/api';
import { createBexioClient, type BexioClient } from './client';

export const BEXIO_API_URL = 'https://api.bexio.com';

/**
 * Reads bexio with the key of the bexio payment provider set up under
 * Integrations: the same account that holds the institutional, gift,
 * bookshop and single-issue invoices. No provider or no key → no bexio rows.
 */
@Injectable()
export class BexioPrintSourceService {
  constructor(private payments: PaymentsService) {}

  async client(fetchFn: typeof fetch = fetch): Promise<BexioClient | null> {
    for (const provider of this.payments.getProviders()) {
      if (!(provider instanceof BexioPaymentProvider)) {
        continue;
      }

      const config = await provider.getConfig();

      if (config?.apiKey) {
        return createBexioClient({
          apiUrl: BEXIO_API_URL,
          token: config.apiKey,
          fetchFn,
        });
      }
    }

    return null;
  }

  /** Whether a bexio payment provider with an API key exists: what the «bexio» option can do. */
  async configured(): Promise<boolean> {
    return (await this.client()) !== null;
  }
}
