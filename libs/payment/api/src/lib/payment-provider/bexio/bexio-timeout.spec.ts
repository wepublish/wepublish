import Bexio from 'bexio';
import { BexioTimeoutError, withRequestTimeout } from './bexio-timeout';

type Request = (method: string, path: string) => Promise<unknown>;

const requestOf = (resource: unknown) =>
  (resource as { request: Request }).request;

const stubRequest = (resource: unknown, request: Request) => {
  (resource as { request: Request }).request = request;
};

describe('withRequestTimeout', () => {
  it('gives up on a bexio call that does not answer, so it cannot stall the nightly run', async () => {
    const bexio = new Bexio('token');
    stubRequest(bexio.invoices, () => new Promise(() => undefined));

    withRequestTimeout(bexio, 20);

    const error = await requestOf(bexio.invoices)
      .call(bexio.invoices, 'GET', '/kb_invoice/7/pdf')
      .catch((e: Error) => e);

    expect(error).toBeInstanceOf(BexioTimeoutError);
    expect((error as Error).message).toBe(
      'bexio did not answer GET /kb_invoice/7/pdf within 20 ms'
    );
  });

  it('passes answers and refusals through', async () => {
    const bexio = new Bexio('token');
    const refusal = { code: 404, message: 'Not found' };
    stubRequest(bexio.contacts, async () => ({ id: 1 }));
    stubRequest(bexio.invoices, () => Promise.reject(refusal));

    withRequestTimeout(bexio, 1_000);

    await expect(
      requestOf(bexio.contacts).call(bexio.contacts, 'GET', '/contact/1')
    ).resolves.toEqual({ id: 1 });
    await expect(
      requestOf(bexio.invoices).call(bexio.invoices, 'GET', '/kb_invoice/1')
    ).rejects.toBe(refusal);
  });

  it('covers the calls of every resource the provider uses', async () => {
    const bexio = new Bexio('token');

    withRequestTimeout(bexio, 1_000);

    for (const resource of [bexio.contacts, bexio.invoices, bexio.users]) {
      expect(requestOf(resource).name).toBe('requestWithTimeout');
    }
  });
});
