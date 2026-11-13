import { ApolloClient } from '@apollo/client';
import { render, screen } from '@testing-library/react';
import {
  FeaturesDocument,
  InvoicesDocument,
  MeDocument,
  NavigationListDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { ComponentType } from 'react';

import { prefetchProfile, ProfilePage } from './profile-page';

vi.mock('../auth-guard', () => ({
  withAuthGuard: (Cmp: ComponentType) => Cmp,
}));

vi.mock('../router-hooks', () => ({
  useQueryParams: () => ({}),
}));

vi.mock('@tanstack/react-router', async importOriginal => ({
  ...(await importOriginal<object>()),
  useNavigate: () => vi.fn(),
}));

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<object>()),
  useApolloClient: () => ({ refetchQueries: vi.fn() }),
  useMutation: () => [vi.fn(), {}],
}));

// The shared profile parts decide the layout from the feature flag and have
// their own specs; here they only have to be the ones rendered.
vi.mock('../../lib/components/profile/profile-subscriptions', () => ({
  ProfileSubscriptions: () => <div data-testid="profile-subscriptions" />,
}));

vi.mock('../../lib/components/profile/profile-details', () => ({
  ProfileDetails: () => <div data-testid="profile-details" />,
}));

vi.mock('@wepublish/website/builder', async importOriginal => ({
  ...(await importOriginal<object>()),
  useWebsiteBuilder: () => ({ elements: { Alert: () => null } }),
}));

vi.mock('react-i18next', async importOriginal => ({
  ...(await importOriginal<object>()),
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('prefetchProfile', () => {
  it('fetches what the profile renders, the feature flags included', async () => {
    const query = vi.fn().mockResolvedValue({ data: {} });

    await prefetchProfile({ query } as unknown as ApolloClient);

    expect(query.mock.calls.map(([options]) => options.query)).toEqual(
      expect.arrayContaining([
        MeDocument,
        NavigationListDocument,
        InvoicesDocument,
        SubscriptionsDocument,
        // decides between the subscription history and the old cards
        FeaturesDocument,
      ])
    );
  });
});

describe('ProfilePage', () => {
  it('renders the shared profile: subscriptions, then the profile details', () => {
    render(<ProfilePage />);

    const parts = screen
      .getAllByTestId(/^profile-/)
      .map(element => element.dataset['testid']);

    expect(parts).toEqual(['profile-subscriptions', 'profile-details']);
  });
});
