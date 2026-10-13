import { GateActionRole, GateMode } from '@prisma/client';
import { HasPaywallResolver } from './has-paywall/has-paywall.resolver';
import { PaywallResolver } from './paywall.resolver';
import { toPaywall } from './to-paywall';

const gate = (overrides: Record<string, unknown> = {}) =>
  ({
    id: 'gate-1',
    createdAt: new Date('2026-01-01'),
    modifiedAt: new Date('2026-01-02'),
    mode: GateMode.PAYWALL,
    name: 'Premium',
    active: true,
    anyMemberPlan: false,
    fadeout: true,
    previewBlocks: 4,
    description: [{ type: 'doc' }],
    circumventDescription: null,
    upgradeDescription: null,
    upgradeCircumventDescription: null,
    actions: [],
    ...overrides,
  }) as any;

describe('toPaywall', () => {
  it('maps a paywall gate onto the paywall the website knows', () => {
    expect(toPaywall(gate())).toEqual({
      id: 'gate-1',
      createdAt: new Date('2026-01-01'),
      modifiedAt: new Date('2026-01-02'),
      name: 'Premium',
      active: true,
      anyMemberPlan: false,
      fadeout: true,
      hideContentAfter: 4,
      description: [{ type: 'doc' }],
      circumventDescription: null,
      upgradeDescription: null,
      upgradeCircumventDescription: null,
      alternativeSubscribeUrl: undefined,
    });
  });

  it('takes alternativeSubscribeUrl from the primary action', () => {
    expect(
      toPaywall(
        gate({
          actions: [
            { role: GateActionRole.OTHER, url: 'https://other' },
            { role: GateActionRole.PRIMARY, url: 'https://abo' },
          ],
        })
      ).alternativeSubscribeUrl
    ).toBe('https://abo');
  });

  it('hides nothing when a gate has no preview blocks', () => {
    expect(toPaywall(gate({ previewBlocks: null })).hideContentAfter).toBe(0);
  });

  it('is not a paywall when the gate is not one', () => {
    expect(toPaywall(gate({ mode: GateMode.BANNER }))).toBeNull();
    expect(toPaywall(null)).toBeNull();
  });
});

describe('PaywallResolver', () => {
  const gateService = {
    getGates: vi.fn(),
    getBypasses: vi.fn(),
  };
  const gateDataloader = { load: vi.fn() };
  const memberPlans = { load: vi.fn() };
  const resolver = () =>
    new PaywallResolver(
      gateDataloader as any,
      memberPlans as any,
      gateService as any
    );

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('answers a paywall by id', async () => {
    gateDataloader.load.mockResolvedValue(gate());

    expect(await resolver().paywall('gate-1')).toMatchObject({
      id: 'gate-1',
      hideContentAfter: 4,
    });
  });

  it('does not answer other gates as paywalls', async () => {
    gateDataloader.load.mockResolvedValue(gate({ mode: GateMode.BANNER }));

    expect(await resolver().paywall('gate-1')).toBeNull();
  });

  it('lists the paywalls', async () => {
    gateService.getGates.mockResolvedValue([gate()]);

    expect(await resolver().paywalls()).toMatchObject([{ id: 'gate-1' }]);
    expect(gateService.getGates).toHaveBeenCalledWith({
      mode: GateMode.PAYWALL,
    });
  });

  it('answers bypasses with the paywall they belong to', async () => {
    gateService.getBypasses.mockResolvedValue([
      { id: 'b-1', token: 'abc', gateId: 'gate-1' },
    ]);

    expect(await resolver().bypasses({ id: 'gate-1' } as any)).toEqual([
      { id: 'b-1', token: 'abc', gateId: 'gate-1', paywallId: 'gate-1' },
    ]);
  });

  it('answers the member plans of the gate', async () => {
    memberPlans.load.mockResolvedValue([{ id: 'plan-1' }]);

    expect(await resolver().memberPlans({ id: 'gate-1' } as any)).toEqual([
      { id: 'plan-1' },
    ]);
    expect(memberPlans.load).toHaveBeenCalledWith('gate-1');
  });
});

describe('HasPaywallResolver', () => {
  const gateDataloader = { load: vi.fn() };
  const resolver = new HasPaywallResolver(gateDataloader as any);

  it('resolves the paywall of an article', async () => {
    gateDataloader.load.mockResolvedValue(gate());

    expect(await resolver.paywall({ paywallId: 'gate-1' })).toMatchObject({
      id: 'gate-1',
      hideContentAfter: 4,
    });
  });

  it('resolves no paywall without a paywallId', async () => {
    expect(await resolver.paywall({ paywallId: null } as any)).toBeNull();
  });
});
