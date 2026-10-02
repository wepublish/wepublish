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
    'settings:mailprovider',
    'settings:paymentprovider',
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
