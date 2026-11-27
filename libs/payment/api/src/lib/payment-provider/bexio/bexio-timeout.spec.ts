import Bexio from 'bexio';
import {
  BexioBreaker,
  BexioTimeoutError,
  BexioUnavailableError,
  withRequestTimeout,
} from './bexio-timeout';

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

describe('BexioBreaker', () => {
  const stalled = () => new Promise<never>(() => undefined);

  const gatewayWith = (breaker: BexioBreaker) => {
    const bexio = new Bexio('token');
    const contacts = vi.fn(async () => ({ id: 1 }));
    stubRequest(bexio.invoices, stalled);
    stubRequest(bexio.contacts, contacts);
    withRequestTimeout(bexio, 20, breaker);

    return {
      invoices: () =>
        requestOf(bexio.invoices).call(bexio.invoices, 'POST', '/kb_invoice'),
      contacts: () =>
        requestOf(bexio.contacts).call(bexio.contacts, 'GET', '/contact/1'),
      contactsReached: contacts,
    };
  };

  it('fails every following call at once after bexio did not answer, so an outage costs one timeout and not one per subscription', async () => {
    const gateway = gatewayWith(new BexioBreaker());

    await expect(gateway.invoices()).rejects.toBeInstanceOf(BexioTimeoutError);
    const error = await gateway.contacts().catch((e: Error) => e);

    expect(error).toBeInstanceOf(BexioUnavailableError);
    expect((error as Error).message).toMatch(
      /^bexio did not answer a call a moment ago, GET \/contact\/1 is not tried until /
    );
    expect(gateway.contactsReached).not.toHaveBeenCalled();
  });

  it('pauses the other gateways of the same provider too', async () => {
    const breaker = new BexioBreaker();

    await expect(gatewayWith(breaker).invoices()).rejects.toBeInstanceOf(
      BexioTimeoutError
    );

    const other = gatewayWith(breaker);
    await expect(other.contacts()).rejects.toBeInstanceOf(BexioUnavailableError);
    expect(other.contactsReached).not.toHaveBeenCalled();
  });

  it('tries bexio again once the pause is over', async () => {
    let now = 1_000;
    const gateway = gatewayWith(new BexioBreaker(60_000, () => now));

    await expect(gateway.invoices()).rejects.toBeInstanceOf(BexioTimeoutError);
    now += 60_000;

    await expect(gateway.contacts()).resolves.toEqual({ id: 1 });
  });

  it('keeps going after a refusal, bexio did answer', async () => {
    const breaker = new BexioBreaker();
    const refusal = { code: 422, message: 'Invalid' };

    await expect(
      breaker.call('POST', '/contact', () => Promise.reject(refusal))
    ).rejects.toBe(refusal);
    await expect(
      breaker.call('GET', '/contact/1', async () => ({ id: 1 }))
    ).resolves.toEqual({ id: 1 });
  });

  it('pauses after a fetch that was aborted for taking too long', async () => {
    const breaker = new BexioBreaker();
    const aborted = Object.assign(new Error('The user aborted a request.'), {
      name: 'AbortError',
    });

    await expect(
      breaker.call('GET', '/kb_invoice/7', () => Promise.reject(aborted))
    ).rejects.toBe(aborted);
    await expect(
      breaker.call('GET', '/kb_invoice/8', async () => 'paid')
    ).rejects.toBeInstanceOf(BexioUnavailableError);
  });
});
