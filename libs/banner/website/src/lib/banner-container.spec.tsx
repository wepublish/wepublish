import { screen } from '@testing-library/react';
import {
  mockBanner,
  mockOperation,
  mockSensitiveDataUser,
  mockSubscription,
  renderWithProviders,
} from '@wepublish/mocks/website';
import { BYPASS_COOKIE_KEY } from '@wepublish/paywall/website';
import {
  BannerDocumentType,
  FullBannerFragment,
  FullSubscriptionFragment,
  PrimaryBannerDocument,
  PrimaryBannerQueryVariables,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { BannerContainer } from './banner-container';
import { BANNER_STORAGE_KEY } from './collapse-banner';

const banner = mockBanner();

const primaryBanner = (
  variables: Partial<PrimaryBannerQueryVariables>,
  result: FullBannerFragment | null = banner
) =>
  mockOperation(PrimaryBannerDocument, {
    variables: {
      documentId: '1',
      documentType: BannerDocumentType.Article,
      loggedIn: false,
      hasSubscription: false,
      hasPaywallBypass: false,
      ...variables,
    },
    data: { __typename: 'Query', primaryBanner: result },
  });

const subscriptions = (userSubscriptions: FullSubscriptionFragment[]) =>
  mockOperation(SubscriptionsDocument, {
    variables: {},
    data: { __typename: 'Query', userSubscriptions },
  });

const renderContainer = (options: Parameters<typeof renderWithProviders>[1]) =>
  renderWithProviders(
    <BannerContainer
      documentType={BannerDocumentType.Article}
      documentId="1"
    />,
    options
  );

describe('BannerContainer', () => {
  beforeEach(() => {
    localStorage.removeItem(BANNER_STORAGE_KEY);
  });

  afterEach(() => {
    document.cookie = `${BYPASS_COOKIE_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });

  it('loads the primary banner for a logged out reader', async () => {
    renderContainer({ mocks: [primaryBanner({})] });

    expect(await screen.findByText(banner.title)).toBeInTheDocument();
  });

  it('asks for the banner of logged in readers without subscription', async () => {
    renderContainer({
      user: mockSensitiveDataUser(),
      mocks: [
        subscriptions([mockSubscription({ isActive: false })]),
        primaryBanner({ loggedIn: true }),
      ],
    });

    expect(await screen.findByText(banner.title)).toBeInTheDocument();
  });

  it('waits for the subscriptions and asks for the banner of subscribers', async () => {
    const subscriberBanner = mockBanner({ title: 'Danke für dein Abo' });

    renderContainer({
      user: mockSensitiveDataUser(),
      mocks: [
        subscriptions([mockSubscription()]),
        primaryBanner(
          { loggedIn: true, hasSubscription: true },
          subscriberBanner
        ),
      ],
    });

    expect(await screen.findByText('Danke für dein Abo')).toBeInTheDocument();
  });

  it('tells the API about a paywall bypass', async () => {
    document.cookie = `${BYPASS_COOKIE_KEY}=token; path=/`;

    renderContainer({ mocks: [primaryBanner({ hasPaywallBypass: true })] });

    expect(await screen.findByText(banner.title)).toBeInTheDocument();
  });

  it('asks without a document id on pages without one', async () => {
    renderWithProviders(
      <BannerContainer documentType={BannerDocumentType.Page} />,
      {
        mocks: [
          primaryBanner({
            documentId: '',
            documentType: BannerDocumentType.Page,
          }),
        ],
      }
    );

    expect(await screen.findByText(banner.title)).toBeInTheDocument();
  });
});
