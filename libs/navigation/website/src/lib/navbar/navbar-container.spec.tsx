import { ApolloClient } from '@apollo/client';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockInvoice,
  mockNavigations,
  mockOperation,
  mockPeerProfile,
  mockPeerProfileQuery,
  mockSensitiveDataUser,
  mockSubscription,
  mockCurrentSessionQuery,
  mockSettingListQuery,
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FullInvoiceFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  NavigationListDocument,
  PeerProfileDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { t } from 'i18next';
import { FooterContainer } from '../footer/footer-container';
import { NavbarContainer } from './navbar-container';

const props = {
  slug: 'main',
  categorySlugs: [['categories'], ['about']],
  headerSlug: 'main',
};

const navigationList = mockOperation(NavigationListDocument, {
  variables: {},
  data: { __typename: 'Query', navigations: mockNavigations() },
});

const invoices = (userInvoices: FullInvoiceFragment[]) =>
  mockOperation(InvoicesDocument, {
    variables: {},
    data: { __typename: 'Query', userInvoices },
  });

const subscriptions = (userSubscriptions: FullSubscriptionFragment[]) =>
  mockOperation(SubscriptionsDocument, {
    variables: {},
    data: { __typename: 'Query', userSubscriptions },
  });

const cacheAndNetwork = {
  watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
} as unknown as ApolloClient.DefaultOptions;

// The account setup state is only fetched for a logged in reader.
const accountSetupMocks = [mockSettingListQuery(), mockCurrentSessionQuery()];

const renderContainer = ({
  mocks = [],
  ...options
}: Parameters<typeof renderWithProviders>[1] = {}) =>
  renderWithProviders(<NavbarContainer {...props} />, {
    ...options,
    mocks: [...accountSetupMocks, ...mocks],
  });

describe('NavbarContainer', () => {
  it('shows the navigations from the API in the menu', async () => {
    const user = userEvent.setup();
    renderContainer({ mocks: [navigationList, mockPeerProfileQuery()] });

    await user.click(screen.getByRole('button', { name: 'Menu' }));

    expect(
      await screen.findByRole('link', { name: 'Mobilität' })
    ).toHaveAttribute('href', '/mobilitaet');
    expect(screen.getByRole('link', { name: 'Team' })).toHaveAttribute(
      'href',
      '/team'
    );
  });

  it('shows the logo of the peer profile', async () => {
    const { container } = renderContainer({
      mocks: [navigationList, mockPeerProfileQuery()],
    });

    await screen.findAllByRole('link', { name: 'Gesellschaft' });

    expect(
      container.querySelector('a[aria-label="Startseite"] img')
    ).toBeInTheDocument();
  });

  it('shows no logo when the peer profile has none', async () => {
    const { container } = renderContainer({
      mocks: [
        navigationList,
        mockPeerProfileQuery(mockPeerProfile({ logo: null })),
      ],
    });

    await screen.findAllByRole('link', { name: 'Gesellschaft' });

    expect(
      container.querySelector('a[aria-label="Startseite"] img')
    ).not.toBeInTheDocument();
  });

  it('offers the subscription to a logged out reader without asking for invoices', async () => {
    renderContainer({ mocks: [navigationList, mockPeerProfileQuery()] });

    expect(
      await screen.findByRole('link', { name: t('navbar.subscribe') })
    ).toHaveAttribute('href', '/mitmachen');
  });

  it('warns a logged in reader about an unpaid invoice', async () => {
    renderContainer({
      user: mockSensitiveDataUser(),
      mocks: [
        navigationList,
        mockPeerProfileQuery(),
        invoices([mockInvoice({ paidAt: null, canceledAt: null })]),
        subscriptions([mockSubscription()]),
      ],
    });

    expect(
      await screen.findByRole('link', { name: new RegExp(t('navbar.invoice')) })
    ).toHaveAttribute('href', '/profile');
  });

  it('ignores canceled invoices and links to the account with a running subscription', async () => {
    renderContainer({
      user: mockSensitiveDataUser(),
      mocks: [
        navigationList,
        mockPeerProfileQuery(),
        invoices([
          mockInvoice({ paidAt: null, canceledAt: '2024-01-01T00:00:00.000Z' }),
        ]),
        subscriptions([mockSubscription({ deactivation: null })]),
      ],
    });

    expect(
      await screen.findByRole('link', { name: t('navbar.myAccount') })
    ).toHaveAttribute('href', '/profile');
    expect(
      screen.queryByRole('link', { name: new RegExp(t('navbar.invoice')) })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: t('navbar.subscribe') })
    ).not.toBeInTheDocument();
  });

  it('reuses the navigations and the peer profile from the cache on the next page', async () => {
    const user = userEvent.setup();
    const { rerender } = renderWithProviders(<NavbarContainer {...props} />, {
      apolloDefaultOptions: cacheAndNetwork,
      mocks: [
        navigationList,
        mockOperation(PeerProfileDocument, {
          variables: {},
          data: { __typename: 'Query', peerProfile: mockPeerProfile() },
        }),
      ],
    });

    await user.click(screen.getByRole('button', { name: 'Menu' }));
    await screen.findByRole('link', { name: 'Mobilität' });

    rerender(
      <>
        <NavbarContainer
          key="next-page"
          {...props}
        />
        <FooterContainer
          slug="main"
          categorySlugs={[]}
        />
      </>
    );

    expect(await screen.findByRole('contentinfo')).toHaveTextContent(
      'Gesellschaft'
    );
  });
});
