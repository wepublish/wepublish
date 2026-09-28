import { PaywallResolver } from './paywall.resolver';

describe('PaywallResolver', () => {
  it('answers a deleted paywall with the paywall, as the editor selects its fields', async () => {
    const deleted = { id: 'paywall-1', name: 'Paywall', active: false };
    const resolver = new PaywallResolver(
      {} as any,
      {} as any,
      { deletePaywall: vi.fn().mockResolvedValue(deleted) } as any
    );

    await expect(resolver.deletePaywall('paywall-1')).resolves.toEqual(deleted);
  });
});
