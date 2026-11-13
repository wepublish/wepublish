import { useQuery } from '@apollo/client/react';
import { act, waitFor } from '@testing-library/react';
import {
  mockMemberPlan,
  mockPeriodicityPrice,
  mockSensitiveDataUser,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FullMemberPlanFragment,
  FullSubscriptionFragment,
  SubscriptionsDocument,
} from '@wepublish/website/api';

import { ForceUpgradeContext } from '../reflekt-force-upgrade-context';
import { useForceUpgradeRedirect } from './use-force-upgrade-redirect';

const plan = (id: string, amountMin: number) =>
  mockMemberPlan({
    id,
    periodicityPricing: [mockPeriodicityPrice({ amountMin })],
  });

const basic = plan('basic', 1000);
const plus = plan('plus', 3000);

const subscription = mockSubscription({
  id: 'sub-1',
  memberPlan: basic,
  monthlyAmount: 1000,
}) as FullSubscriptionFragment;

const Probe = ({ memberPlans }: { memberPlans: FullMemberPlanFragment[] }) => {
  useQuery(SubscriptionsDocument);
  useForceUpgradeRedirect(memberPlans);

  return null;
};

const renderProbe = (forceUpgrade: boolean, asPath: string) =>
  renderWithProviders(
    <ForceUpgradeContext.Provider value={forceUpgrade}>
      <Probe memberPlans={[basic, plus]} />
    </ForceUpgradeContext.Provider>,
    {
      user: mockSensitiveDataUser(),
      router: { asPath },
      mocks: [
        {
          request: { query: SubscriptionsDocument },
          result: { data: { userSubscriptions: [subscription] } },
          maxUsageCount: Number.POSITIVE_INFINITY,
        },
      ],
    }
  );

const settle = () => act(() => new Promise(resolve => setTimeout(resolve, 50)));

describe('useForceUpgradeRedirect', () => {
  it('rewrites the url to the cheapest upgradeable subscription when the page forces an upgrade', async () => {
    const { router } = renderProbe(true, '/mitmachen?tag=news');

    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith(
        '/mitmachen?tag=news&upgradeSubscriptionId=sub-1'
      )
    );
    expect(router.push).not.toHaveBeenCalled();
  });

  it('leaves the url alone when the page does not force an upgrade', async () => {
    const { router } = renderProbe(false, '/mitmachen');

    await settle();

    expect(router.replace).not.toHaveBeenCalled();
  });

  it('leaves the url alone when it already names the subscription', async () => {
    const { router } = renderProbe(
      true,
      '/mitmachen?upgradeSubscriptionId=sub-1'
    );

    await settle();

    expect(router.replace).not.toHaveBeenCalled();
  });
});
