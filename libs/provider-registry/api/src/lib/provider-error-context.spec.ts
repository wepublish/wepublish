import { withProviderErrorContext } from './provider-error-context';

class RecipientRefused extends Error {}

class FakeBexio {
  readonly id = 'bexio';
  readonly label = 'Bexio';

  constructor(
    private failure: unknown,
    private name: Promise<string> = Promise.resolve('Bexio Live')
  ) {}

  getName() {
    return this.name;
  }

  async createRemoteInvoice() {
    throw this.failure;
  }

  async createIntent() {
    return { intentID: '1' };
  }

  checkConfig() {
    throw new Error('bad config');
  }
}

describe('withProviderErrorContext', () => {
  it('says which provider failed in which method, also for a plain object an SDK rejects with', async () => {
    const provider = withProviderErrorContext(
      'Payment provider',
      new FakeBexio({ code: 401, message: { message: 'Unauthorized' } })
    );

    await expect(provider.createRemoteInvoice()).rejects.toThrow(
      'Payment provider "Bexio Live" (FakeBexio, id bexio) failed in createRemoteInvoice: 401 Unauthorized'
    );
  });

  it('keeps the class of the error, so callers still recognise it', async () => {
    const provider = withProviderErrorContext(
      'Mail provider',
      new FakeBexio(new RecipientRefused('bounced'))
    );

    const error = await provider.createRemoteInvoice().catch(e => e);

    expect(error).toBeInstanceOf(RecipientRefused);
    expect(error.message).toBe(
      'Mail provider "Bexio Live" (FakeBexio, id bexio) failed in createRemoteInvoice: bounced'
    );
  });

  it('says which provider failed when a method throws right away, without waiting for its name', () => {
    const provider = withProviderErrorContext(
      'Payment provider',
      new FakeBexio(undefined)
    );

    expect(() => provider.checkConfig()).toThrow(
      'Payment provider (FakeBexio, id bexio) failed in checkConfig: bad config'
    );
  });

  it('still says which provider failed when its name cannot be read', async () => {
    const provider = withProviderErrorContext(
      'Payment provider',
      new FakeBexio(new Error('down'), Promise.reject(new Error('no config')))
    );

    await expect(provider.createRemoteInvoice()).rejects.toThrow(
      'Payment provider (FakeBexio, id bexio) failed in createRemoteInvoice: down'
    );
  });

  it('passes results and properties through unchanged', async () => {
    const provider = withProviderErrorContext(
      'Payment provider',
      new FakeBexio(undefined)
    );

    await expect(provider.createIntent()).resolves.toEqual({ intentID: '1' });
    expect(provider.id).toBe('bexio');
    expect(provider.label).toBe('Bexio');
    await expect(provider.getName()).resolves.toBe('Bexio Live');
  });

  it('stays an instance of the provider class', () => {
    expect(
      withProviderErrorContext('Payment provider', new FakeBexio(undefined))
    ).toBeInstanceOf(FakeBexio);
  });
});
