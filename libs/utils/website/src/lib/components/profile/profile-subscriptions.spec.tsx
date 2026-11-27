import { screen, within } from '@testing-library/react';
import {
  mockMemberPlan,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FeaturesDocument,
  FullSubscriptionFragment,
  InvoicesDocument,
  ProductType,
  SubscriptionDeactivationReason,
  SubscriptionsDocument,
} from '@wepublish/website/api';

import { ProfileSubscriptions } from './profile-subscriptions';

const mocks = (
  features: string[],
  subscriptions: FullSubscriptionFragment[] = []
) => [
  {
    request: { query: FeaturesDocument },
    result: { data: { features } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: { query: SubscriptionsDocument },
    result: { data: { userSubscriptions: subscriptions } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: { query: InvoicesDocument },
    result: { data: { userInvoices: [] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

const renderWith = (
  features: string[],
  subscriptions?: FullSubscriptionFragment[]
) =>
  renderWithProviders(<ProfileSubscriptions />, {
    mocks: mocks(features, subscriptions),
  });

// ended, so it only shows where ended ones are listed too
const donation = mockSubscription({
  id: 'donation',
  memberPlan: mockMemberPlan({
    name: 'Spende monatlich',
    productType: ProductType.Donation,
  }),
  isActive: false,
  paidUntil: '2026-01-01T00:00:00.000Z',
  deactivation: {
    __typename: 'SubscriptionDeactivation',
    date: '2026-01-01T00:00:00.000Z',
    reason: SubscriptionDeactivationReason.UserSelfDeactivated,
  },
}) as FullSubscriptionFragment;

describe('ProfileSubscriptions', () => {
  it('shows subscriptions and invoices as one history when the medium has it', async () => {
    renderWith(['profile-subscription-history']);

    expect(
      await screen.findByRole('heading', { name: 'Abos und Rechnungen' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Aktive Abos' })
    ).not.toBeInTheDocument();
  });

  it('lists donations in a history of their own, ended ones included', async () => {
    renderWith(['profile-subscription-history'], [donation]);

    const heading = await screen.findByRole('heading', {
      name: 'Spenden und Rechnungen',
    });
    const section = heading.parentElement as HTMLElement;

    expect(
      within(section).getByRole('button', { name: 'Beendete Spenden (1)' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Aktive Spenden' })
    ).not.toBeInTheDocument();
  });

  it('shows the subscription cards otherwise', async () => {
    renderWith([]);

    expect(
      await screen.findByRole('heading', { name: 'Aktive Abos' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Abos und Rechnungen' })
    ).not.toBeInTheDocument();
  });
});
