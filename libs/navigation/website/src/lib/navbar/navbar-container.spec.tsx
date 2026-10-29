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
  renderWithProviders,
} from '@wepublish/mocks/website';
import {
  FullInvoiceFragment,
  FullSubscriptionFragment,
  InvoicesDocument,
  NavigationListDocument,
  PeerProfileDocument,
  FeaturesDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { actWait } from '@wepublish/testing';
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

// a logged in reader's navbar asks which features the medium has
const features = (enabled: string[] = []) =>
  mockOperation(FeaturesDocument, {
    maxUsageCount: Number.POSITIVE_INFINITY,
    data: { __typename: 'Query', features: enabled },
  });

const cacheAndNetwork = {
  watchQuery: { fetchPolicy: 'cache-and-network', errorPolicy: 'all' },
} as unknown as ApolloClient.DefaultOptions;

const renderContainer = (
  options: Parameters<typeof renderWithProviders>[1] = {}
) => renderWithProviders(<NavbarContainer {...props} />, options);

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
        features(),
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
        features(),
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

  describe('which open invoices it warns about', () => {
    const subscription = mockSubscription({ deactivation: null });
    // open since 2023, while the reader paid 2024: left over, not owed
    const leftOver = mockInvoice({
      id: 'left-over',
      subscription,
      dueAt: '2023-10-07T00:00:00.000Z',
      paidAt: null,
      canceledAt: null,
    });
    const paidLater = mockInvoice({
      id: 'paid-later',
      subscription,
      dueAt: '2024-10-07T00:00:00.000Z',
      paidAt: '2024-10-09T00:00:00.000Z',
      canceledAt: null,
    });
    const renderOnHome = (
      userInvoices: FullInvoiceFragment[],
      enabled: string[]
    ) =>
      renderContainer({
        user: mockSensitiveDataUser(),
        router: { pathname: '/', asPath: '/' },
        mocks: [
          navigationList,
          mockPeerProfileQuery(),
          invoices(userInvoices),
          subscriptions([subscription]),
          features(enabled),
        ],
      });

    it('leaves out invoices that are left over, with the subscription history', async () => {
      renderOnHome([leftOver, paidLater], ['profile-subscription-history']);
      await actWait(150);

      expect(
        screen.queryByRole('link', { name: new RegExp(t('navbar.invoice')) })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: t('navbar.myAccount') })
      ).toBeInTheDocument();
    });

    it('warns about a due invoice, with the subscription history', async () => {
      renderOnHome([leftOver], ['profile-subscription-history']);

      expect(
        await screen.findByRole('link', {
          name: new RegExp(t('navbar.invoice')),
        })
      ).toBeInTheDocument();
    });

    it('warns about any open invoice without it', async () => {
      renderOnHome([leftOver, paidLater], []);

      expect(
        await screen.findByRole('link', {
          name: new RegExp(t('navbar.invoice')),
        })
      ).toBeInTheDocument();
    });
  });

  describe('in the account, with the subscription history', () => {
    const renderInAccount = (
      path: string,
      {
        unpaid = false,
        enabled = ['profile-subscription-history'],
      }: { unpaid?: boolean; enabled?: string[] } = {}
    ) =>
      renderContainer({
        user: mockSensitiveDataUser(),
        router: { pathname: path, asPath: path },
        mocks: [
          navigationList,
          mockPeerProfileQuery(),
          invoices(
            unpaid ? [mockInvoice({ paidAt: null, canceledAt: null })] : []
          ),
          subscriptions([mockSubscription({ deactivation: null })]),
          features(enabled),
        ],
      });

    it.each(['/profile', '/profile/subscription/abc'])(
      'leaves out the link to the account on %s',
      async path => {
        renderInAccount(path);
        await actWait(150);

        expect(
          screen.queryByRole('link', { name: t('navbar.myAccount') })
        ).not.toBeInTheDocument();
      }
    );

    it('still warns about an unpaid invoice there', async () => {
      renderInAccount('/profile', { unpaid: true });

      expect(
        await screen.findByRole('link', {
          name: new RegExp(t('navbar.invoice')),
        })
      ).toHaveAttribute('href', '/profile');
    });

    it('keeps the link to the account without the subscription history', async () => {
      renderInAccount('/profile', { enabled: [] });

      expect(
        await screen.findByRole('link', { name: t('navbar.myAccount') })
      ).toHaveAttribute('href', '/profile');
    });
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
