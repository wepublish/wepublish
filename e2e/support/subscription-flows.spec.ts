import { describe, expect, it } from 'vitest';
import { flowFor, type Flow } from './subscription-flows';

const flow = (id: string, over: Partial<Flow> = {}): Flow => ({
  id,
  default: false,
  memberPlan: { id: 'plan' },
  paymentMethods: [{ id: 'bexio' }],
  periodicities: ['yearly'],
  autoRenewal: [true],
  intervals: [],
  ...over,
});

const subscription = {
  memberPlanId: 'plan',
  paymentMethodId: 'bexio',
  periodicity: 'yearly',
  autoRenew: true,
};

describe('flowFor', () => {
  const fallback = flow('default', { default: true, memberPlan: null });

  it("takes the plan's flow for the subscription's payment method, periodicity and renewal", () => {
    expect(flowFor([fallback, flow('plan-flow')], subscription).id).toBe('plan-flow');
  });

  it('falls back to the default flow when no plan flow matches', () => {
    const others = [
      flow('other-method', { paymentMethods: [{ id: 'stripe' }] }),
      flow('other-periodicity', { periodicities: ['monthly'] }),
      flow('other-renewal', { autoRenewal: [false] }),
      flow('other-plan', { memberPlan: { id: 'other' } }),
    ];

    expect(flowFor([fallback, ...others], subscription).id).toBe('default');
  });

  it('takes the first matching flow, as the API does', () => {
    expect(flowFor([flow('first'), flow('second'), fallback], subscription).id).toBe('first');
  });

  it('fails without a default flow to fall back to', () => {
    expect(() => flowFor([flow('other', { memberPlan: { id: 'other' } })], subscription)).toThrow(
      /no default subscription flow/i
    );
  });
});
