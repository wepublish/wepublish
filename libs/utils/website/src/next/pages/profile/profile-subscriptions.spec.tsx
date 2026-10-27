import { screen } from '@testing-library/react';
import { renderWithProviders } from '@wepublish/mocks/website';
import {
  FeaturesDocument,
  InvoicesDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';

import { ProfileSubscriptions } from './profile-subscriptions';

const mocks = (features: string[]) => [
  {
    request: { query: FeaturesDocument },
    result: { data: { features } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: { query: SubscriptionsDocument },
    result: { data: { userSubscriptions: [] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
  {
    request: { query: InvoicesDocument },
    result: { data: { userInvoices: [] } },
    maxUsageCount: Number.POSITIVE_INFINITY,
  },
];

const renderWith = (features: string[]) =>
  renderWithProviders(<ProfileSubscriptions />, { mocks: mocks(features) });

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
