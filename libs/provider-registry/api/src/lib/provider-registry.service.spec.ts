import { loadPaymentProviders } from '@wepublish/payment/api';
import { loadMailProvider } from '@wepublish/mail/api';
import { ProviderRegistryService } from './provider-registry.service';

const { loads } = vi.hoisted(() => ({ loads: { count: 0 } }));

vi.mock('@wepublish/payment/api', () => ({
  loadPaymentProviders: vi.fn(async () => {
    loads.count++;

    return [];
  }),
}));
vi.mock('@wepublish/tracking-pixel/api', () => ({
  loadTrackingPixelProviders: vi.fn(async () => []),
}));
vi.mock('@wepublish/mail/api', () => ({
  loadMailProvider: vi.fn(async () => null),
}));
vi.mock('@wepublish/challenge/api', () => ({
  loadChallengeProvider: vi.fn(async () => null),
}));
vi.mock('@wepublish/letter/api', () => ({
  loadLetterProvider: vi.fn(async () => null),
  loadPdfRenderer: vi.fn(async () => null),
}));

const createReplica = () => {
  const versions: Record<string, string> = {};
  const kv = {
    getNamespaceVersions: vi.fn(async (namespaces: string[]) =>
      namespaces.map(namespace => versions[namespace] ?? 'v1')
    ),
  };
  const registry = new ProviderRegistryService({} as any, kv as any, {} as any);

  return {
    registry,
    otherReplicaSaved: (namespace: string) => {
      versions[namespace] = `${versions[namespace] ?? 'v1'}+`;
    },
  };
};

describe('ProviderRegistryService across replicas', () => {
  beforeEach(() => {
    loads.count = 0;
  });

  it.each([
    'settings:challenge',
    'settings:letterprovider',
    'settings:mailprovider',
    'settings:paymentprovider',
    'settings:pdfrenderer',
    'settings:tracking-pixel',
  ])(
    'rebuilds its providers once another replica saved %s',
    async namespace => {
      const { registry, otherReplicaSaved } = createReplica();
      await registry.ensureLoaded();

      otherReplicaSaved(namespace);
      await registry.reloadWhenChanged();

      expect(loads.count).toBe(2);
    }
  );

  it('keeps its providers while no provider settings changed', async () => {
    const { registry } = createReplica();
    await registry.ensureLoaded();

    await registry.reloadWhenChanged();
    await registry.reloadWhenChanged();

    expect(loads.count).toBe(1);
  });

  it('does not rebuild after its own change was already applied', async () => {
    const { registry, otherReplicaSaved } = createReplica();
    await registry.ensureLoaded();

    otherReplicaSaved('settings:challenge');
    await registry.onProviderSettingsChanged();
    await registry.reloadWhenChanged();

    expect(loads.count).toBe(2);
  });

  it('loads nothing before providers are first needed', async () => {
    const { registry } = createReplica();

    await registry.reloadWhenChanged();

    expect(loads.count).toBe(0);
  });
});

describe('ProviderRegistryService reloads', () => {
  let settings: string;
  let loading: Array<() => void>;

  const nextTick = () => new Promise(resolve => setTimeout(resolve, 0));

  const answerNewestFirst = async () => {
    await nextTick();

    while (loading.length) {
      loading.pop()!();
      await nextTick();
    }
  };

  beforeEach(() => {
    loads.count = 0;
    settings = 'saved before';
    loading = [];
  });

  afterEach(() => {
    vi.mocked(loadPaymentProviders).mockImplementation(async () => {
      loads.count++;

      return [];
    });
  });

  const loadSlowly = () =>
    vi.mocked(loadPaymentProviders).mockImplementation(async () => {
      loads.count++;
      const loaded = [{ id: settings }] as any;
      await new Promise<void>(resolve => loading.push(resolve));

      return loaded;
    });

  it('keeps the providers of the newest settings when a reload starts while an older one is still loading', async () => {
    const { registry } = createReplica();
    await registry.ensureLoaded();
    loadSlowly();

    const older = registry.reload();
    await nextTick();
    settings = 'saved after';
    const newer = registry.onProviderSettingsChanged();
    await answerNewestFirst();
    await Promise.all([older, newer]);

    expect(registry.paymentProviders).toEqual([{ id: 'saved after' }]);
  });

  it('answers a settings change only once its settings are loaded', async () => {
    const { registry } = createReplica();
    await registry.ensureLoaded();
    loadSlowly();

    const older = registry.reload();
    await nextTick();
    settings = 'saved after';
    let applied: unknown;
    const newer = registry
      .onProviderSettingsChanged()
      .then(() => (applied = [...registry.paymentProviders]));
    await answerNewestFirst();
    await Promise.all([older, newer]);

    expect(applied).toEqual([{ id: 'saved after' }]);
  });

  it('loads once more for many changes saved while a reload is running', async () => {
    const { registry } = createReplica();
    await registry.ensureLoaded();
    loadSlowly();

    const reloads = [registry.reload()];
    await nextTick();
    reloads.push(
      registry.onProviderSettingsChanged(),
      registry.onProviderSettingsChanged(),
      registry.onProviderSettingsChanged()
    );
    await answerNewestFirst();
    await Promise.all(reloads);

    expect(loads.count).toBe(3);
  });

  it('still applies a change saved while a reload that fails is running', async () => {
    const { registry } = createReplica();
    await registry.ensureLoaded();
    vi.mocked(loadPaymentProviders).mockImplementationOnce(async () => {
      await new Promise<void>(resolve => loading.push(resolve));
      throw new Error('database down');
    });
    loadSlowly();

    const failing = registry.reload().catch(error => error);
    await nextTick();
    settings = 'saved after';
    const newer = registry.onProviderSettingsChanged();
    await answerNewestFirst();

    expect(await failing).toEqual(new Error('database down'));
    await newer;
    expect(registry.paymentProviders).toEqual([{ id: 'saved after' }]);
  });
});

describe('ProviderRegistryService errors', () => {
  const unauthorized = { code: 401, message: { message: 'Unauthorized' } };

  it('says which payment provider failed', async () => {
    vi.mocked(loadPaymentProviders).mockResolvedValueOnce([
      {
        id: 'bexio',
        getName: async () => 'Bexio',
        createRemoteInvoice: async () => {
          throw unauthorized;
        },
      },
    ] as never);
    const { registry } = createReplica();
    await registry.ensureLoaded();

    await expect(
      registry.paymentProviders[0].createRemoteInvoice({} as never)
    ).rejects.toThrow(
      'Payment provider "Bexio" (Object, id bexio) failed in createRemoteInvoice: 401 Unauthorized'
    );
  });

  it('says which mail provider failed', async () => {
    vi.mocked(loadMailProvider).mockResolvedValueOnce({
      id: 'mailgun',
      getName: async () => 'Mailgun',
      sendMail: async () => {
        throw unauthorized;
      },
    } as never);
    const { registry } = createReplica();
    await registry.ensureLoaded();

    await expect(registry.mailProvider.sendMail({} as never)).rejects.toThrow(
      'Mail provider "Mailgun" (Object, id mailgun) failed in sendMail: 401 Unauthorized'
    );
  });
});
