import { APIRequestContext } from '@playwright/test';

export type BexioConfig = {
  /** Token of the bexio *test* company the target's bexio provider uses. */
  token: string;
  apiUrl?: string;
  /**
   * The provider's test mailbox: during its trial bexio only emails its own
   * sender, so invoice mails to the Resend domain go there.
   */
  testMailbox?: string;
};

// kb_item_status_id values the bexio payment provider maps.
const STATUS: Record<number, string> = {
  7: 'draft',
  8: 'open',
  9: 'paid',
  16: 'partially paid',
  19: 'canceled',
  31: 'unpaid',
};

export const bexioStatus = (id: number) => STATUS[id] ?? `status ${id}`;

/** bexio's invoice mail for a subscription: the subject ends in (Ref <id>). */
export const bexioMailFor = (subscriptionId: string) =>
  new RegExp(`\\(Ref ${subscriptionId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`);

export type BexioInvoice = { id: number; status: string; documentNr: string };

/**
 * Reads the bexio test company the way an accountant would see it, so a
 * journey can check what the provider did there.
 */
export class BexioTestCompany {
  private readonly apiUrl: string;

  constructor(
    private readonly request: APIRequestContext,
    private readonly config: BexioConfig
  ) {
    this.apiUrl = (config.apiUrl ?? 'https://api.bexio.com').replace(/\/+$/, '');
  }

  private async call<T>(method: 'get' | 'post', path: string): Promise<T> {
    const response = await this.request[method](`${this.apiUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.config.token}`, Accept: 'application/json' },
    });

    if (!response.ok()) {
      throw new Error(`bexio ${method.toUpperCase()} ${path} → HTTP ${response.status()}`);
    }

    return (await response.json()) as T;
  }

  /** The invoice the provider created for a we.publish invoice (`api_reference`). */
  async invoiceFor(invoiceId: string): Promise<BexioInvoice | undefined> {
    // The scenario's invoice is among the newest; bexio's search has no api_reference.
    const invoices = await this.call<
      { id: number; api_reference: string | null; kb_item_status_id: number; document_nr: string }[]
    >('get', '/2.0/kb_invoice?order_by=id_desc&limit=100');
    const invoice = invoices.find(i => i.api_reference === invoiceId);

    return invoice && { id: invoice.id, status: bexioStatus(invoice.kb_item_status_id), documentNr: invoice.document_nr };
  }

  async cancel(id: number) {
    await this.call('post', `/2.0/kb_invoice/${id}/cancel`);
  }
}
