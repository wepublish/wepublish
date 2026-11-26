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

describe('PaywallResolver bypasses', () => {
  const bypasses = [{ id: 'bypass-1', token: 'secret', paywallId: 'paywall' }];
  const resolver = () =>
    new PaywallResolver(
      {} as any,
      {} as any,
      { getPaywallBypasses: vi.fn().mockResolvedValue(bypasses) } as any
    );
  const userWith = (...permissionIDs: string[]) =>
    ({ type: 'user', roles: [{ id: 'role', permissionIDs }] }) as any;
  const paywall = (enforced: boolean) =>
    ({ id: 'paywall', enforced, active: true }) as any;

  it('keeps the tokens of a paywall that is not enforced public, as older websites check them', async () => {
    await expect(
      resolver().bypasses(paywall(false), undefined)
    ).resolves.toEqual(bypasses);
  });

  it.each([
    ['anonymous readers', undefined],
    ['readers without editor permissions', userWith('CAN_GET_COMMENTS')],
    [
      'api tokens without them',
      { type: 'apiToken', permissions: ['CAN_GET_PEER'] } as any,
    ],
  ])('hides the tokens of an enforced paywall from %s', async (_, session) => {
    await expect(resolver().bypasses(paywall(true), session)).resolves.toEqual(
      []
    );
  });

  it.each(['CAN_CREATE_PAYWALL', 'CAN_UPDATE_PAYWALL', 'CAN_GET_ARTICLE'])(
    'shows the tokens of an enforced paywall with %s',
    async permission => {
      await expect(
        resolver().bypasses(paywall(true), userWith(permission))
      ).resolves.toEqual(bypasses);
    }
  );
});
