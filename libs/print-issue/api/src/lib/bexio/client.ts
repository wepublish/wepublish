import { fetchUpstream, retry as retryFn, UpstreamError } from '../http';
import type { BexioContact } from './map';
import type { BexioInvoice } from './select';

export type BexioClient = {
  /** invoices dated in [from, to] (YYYY-MM-DD) and which api path answered */
  invoicesInWindow(
    from: string,
    to: string
  ): Promise<{ invoices: BexioInvoice[]; path: 'search' | 'list' }>;
  /** the plain texts of one invoice's positions */
  positions(invoiceId: number): Promise<string[]>;
  contacts(): Promise<Map<number, BexioContact>>;
  countries(): Promise<Map<number, string>>;
  salutations(): Promise<Map<number, string>>;
};

type ClientOptions = {
  apiUrl: string;
  token: string;
  fetchFn?: typeof fetch;
  retry?: Parameters<typeof retryFn>[1];
};

/** bexio's largest page */
const PAGE = 2000;

const stripTags = (text: string) => text.replace(/<[^>]+>/g, '').trim();

export function createBexioClient({
  apiUrl,
  token,
  fetchFn = fetch,
  retry,
}: ClientOptions): BexioClient {
  // 429 and 5xx are retried like the importer does; any other refusal is
  // handed back as a null body so the caller decides what it means
  const request = <T>(path: string, init: RequestInit = {}) =>
    retryFn(async (): Promise<{ status: number; body: T | null }> => {
      const res = await fetchUpstream('bexio', fetchFn, `${apiUrl}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${token}`,
          accept: 'application/json',
          ...(init.body ? { 'content-type': 'application/json' } : {}),
        },
      });

      if (res.status === 429 || res.status >= 500) {
        throw new UpstreamError(
          'bexio',
          res.status,
          `bexio answered ${res.status}`
        );
      }

      return {
        status: res.status,
        body: res.ok ? ((await res.json()) as T) : null,
      };
    }, retry);

  const expectBody = async <T>(
    path: string,
    init?: RequestInit
  ): Promise<T> => {
    const { status, body } = await request<T>(path, init);

    if (body === null) {
      throw new UpstreamError(
        'bexio',
        status,
        `bexio answered ${status} for ${path}`
      );
    }

    return body;
  };

  const paged = async <T>(
    load: (offset: number) => Promise<T[]>,
    first?: T[]
  ): Promise<T[]> => {
    const all: T[] = [];
    let offset = 0;
    let page = first ?? (await load(0));

    for (;;) {
      all.push(...page);

      if (page.length < PAGE) {
        return all;
      }

      offset += PAGE;
      page = await load(offset);
    }
  };

  const lookup = async (path: string): Promise<Map<number, string>> => {
    const { body } = await request<{ id: number; name: string }[]>(path);

    return new Map((body ?? []).map(entry => [entry.id, entry.name]));
  };

  return {
    async invoicesInWindow(from, to) {
      const criteria = JSON.stringify([
        { field: 'is_valid_from', value: from, criteria: '>=' },
        { field: 'is_valid_from', value: to, criteria: '<=' },
      ]);
      const search = (offset: number) =>
        request<BexioInvoice[]>(
          `/2.0/kb_invoice/search?limit=${PAGE}&offset=${offset}`,
          { method: 'POST', body: criteria }
        );
      const first = await search(0);

      if (first.body !== null) {
        const invoices = await paged(
          offset =>
            search(offset).then(({ status, body }) => {
              if (body === null) {
                throw new UpstreamError(
                  'bexio',
                  status,
                  `bexio answered ${status} for search`
                );
              }

              return body;
            }),
          first.body
        );

        return { invoices, path: 'search' };
      }

      // the search field is not accepted: read everything and filter here
      const all = await paged(offset =>
        expectBody<BexioInvoice[]>(
          `/2.0/kb_invoice?limit=${PAGE}&offset=${offset}`
        )
      );

      return {
        invoices: all.filter(
          invoice =>
            invoice.is_valid_from >= from && invoice.is_valid_from <= to
        ),
        path: 'list',
      };
    },

    async positions(invoiceId) {
      const invoice = await expectBody<{
        positions?: { text?: string | null }[];
      }>(`/2.0/kb_invoice/${invoiceId}`);

      return (invoice.positions ?? [])
        .map(position => stripTags(position.text ?? ''))
        .filter(Boolean);
    },

    async contacts() {
      const all = await paged(offset =>
        expectBody<BexioContact[]>(
          `/2.0/contact?limit=${PAGE}&offset=${offset}`
        )
      );

      return new Map(all.map(contact => [contact.id, contact]));
    },

    countries: () => lookup('/2.0/country'),
    salutations: () => lookup('/2.0/salutation'),
  };
}
