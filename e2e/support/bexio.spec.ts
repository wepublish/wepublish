import { APIRequestContext } from '@playwright/test';
import { describe, expect, it } from 'vitest';
import { BexioTestCompany, bexioStatus } from './bexio';

type Call = { method: string; url: string; auth?: string };

const fakeRequest = (responses: Record<string, unknown>, calls: Call[] = []) => {
  const handle =
    (method: string) =>
    async (url: string, options?: { headers?: Record<string, string> }) => {
      calls.push({ method, url, auth: options?.headers?.Authorization });
      const { pathname, search } = new URL(url);

      return {
        ok: () => true,
        status: () => 200,
        json: async () => responses[`${method} ${pathname}${search}`],
      };
    };

  return { get: handle('GET'), post: handle('POST') } as unknown as APIRequestContext;
};

describe('bexioStatus', () => {
  it('names the statuses the payment provider maps', () => {
    expect([7, 8, 9, 16, 19, 31].map(bexioStatus)).toEqual([
      'draft',
      'open',
      'paid',
      'partially paid',
      'canceled',
      'unpaid',
    ]);
  });

  it('keeps unknown ids recognisable', () => {
    expect(bexioStatus(99)).toBe('status 99');
  });
});

describe('BexioTestCompany', () => {
  const newest = 'GET /2.0/kb_invoice?order_by=id_desc&limit=100';

  it('finds the invoice the provider created for a we.publish invoice', async () => {
    const calls: Call[] = [];
    const bexio = new BexioTestCompany(
      fakeRequest(
        {
          [newest]: [
            { id: 12, api_reference: 'other', kb_item_status_id: 8, document_nr: 'RE-12' },
            { id: 11, api_reference: 'inv-1', kb_item_status_id: 8, document_nr: 'RE-11' },
          ],
        },
        calls
      ),
      { token: 'tok' }
    );

    expect(await bexio.invoiceFor('inv-1')).toEqual({ id: 11, status: 'open', documentNr: 'RE-11' });
    expect(calls).toEqual([{ method: 'GET', url: `https://api.bexio.com${newest.slice(4)}`, auth: 'Bearer tok' }]);
  });

  it('has none when bexio has no invoice for it', async () => {
    const bexio = new BexioTestCompany(fakeRequest({ [newest]: [] }), { token: 'tok' });

    expect(await bexio.invoiceFor('inv-1')).toBeUndefined();
  });

  it('cancels an invoice', async () => {
    const calls: Call[] = [];
    const bexio = new BexioTestCompany(
      fakeRequest({ 'POST /2.0/kb_invoice/11/cancel': { success: true } }, calls),
      { token: 'tok' }
    );

    await bexio.cancel(11);

    expect(calls.map(c => `${c.method} ${c.url}`)).toEqual([
      'POST https://api.bexio.com/2.0/kb_invoice/11/cancel',
    ]);
  });
});
