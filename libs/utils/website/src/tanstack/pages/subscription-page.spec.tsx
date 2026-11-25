import { ApolloClient } from '@apollo/client';
import { render, screen } from '@testing-library/react';
import {
  FeaturesDocument,
  InvoicesDocument,
  MeDocument,
  MemberPlanListDocument,
  NavigationListDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { ComponentType } from 'react';

import { prefetchSubscription, SubscriptionPage } from './subscription-page';

vi.mock('../auth-guard', () => ({
  withAuthGuard: (Cmp: ComponentType) => Cmp,
}));

vi.mock('../router-hooks', () => ({
  useQueryParams: () => ({ id: 'sub-1' }),
}));

// Decides between the edit page and the old card from the feature flag; it
// has its own spec.
vi.mock('../../lib/components/profile/profile-subscription', () => ({
  ProfileSubscription: ({ id }: { id: string }) => (
    <div data-testid="profile-subscription">{id}</div>
  ),
}));

const clientWith = (subscriptionIds: string[] | null) => {
  const query = vi.fn().mockImplementation(({ query }) =>
    Promise.resolve(
      query === SubscriptionsDocument ?
        subscriptionIds ?
          {
            data: {
              userSubscriptions: subscriptionIds.map(id => ({ id })),
            },
          }
        : { error: new Error('down') }
      : { data: {} }
    )
  );

  return { client: { query } as unknown as ApolloClient, query };
};

describe('prefetchSubscription', () => {
  it('fetches what the edit page renders, the feature flags and the upgrade plans included', async () => {
    const { client, query } = clientWith(['sub-1']);

    await prefetchSubscription(client, 'sub-1');

    expect(query.mock.calls.map(([options]) => options.query)).toEqual(
      expect.arrayContaining([
        SubscriptionsDocument,
        InvoicesDocument,
        MeDocument,
        NavigationListDocument,
        FeaturesDocument,
        MemberPlanListDocument,
      ])
    );
    expect(query).toHaveBeenCalledWith({
      query: MemberPlanListDocument,
      variables: { take: 50, filter: { active: true } },
    });
  });

  it("says whether the reader's subscription is missing", async () => {
    await expect(
      prefetchSubscription(clientWith(['sub-1']).client, 'sub-1')
    ).resolves.toEqual({ subscriptionMissing: false });
    await expect(
      prefetchSubscription(clientWith(['other']).client, 'sub-1')
    ).resolves.toEqual({ subscriptionMissing: true });
  });

  it('does not call a subscription missing when the list failed to load', async () => {
    await expect(
      prefetchSubscription(clientWith(null).client, 'sub-1')
    ).resolves.toEqual({ subscriptionMissing: false });
  });
});

describe('SubscriptionPage', () => {
  it('renders the shared subscription view for the id in the url', () => {
    render(<SubscriptionPage />);

    expect(screen.getByTestId('profile-subscription').textContent).toBe(
      'sub-1'
    );
  });
});
