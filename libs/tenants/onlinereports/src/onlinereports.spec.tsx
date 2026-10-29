import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockNavigations,
  mockTeaserListBlock,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import deOverridden from './locales/deOverridden.json';
import { onlinereportsTenant } from './onlinereports-tenant';

const navigation = {
  data: { __typename: 'Query' as const, navigations: mockNavigations() },
  loading: false,
  slug: 'main',
  categorySlugs: [['categories', 'about-us']],
};

const TenantPage = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    Navbar,
    Footer,
    elements: { Button },
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <>
      <Navbar
        {...navigation}
        headerSlug="header"
        iconSlug="icons"
        loginBtn={{ href: '/login' }}
        profileBtn={{ href: '/profile' }}
        hasRunningSubscription={false}
        hasUnpaidInvoices={false}
      />

      <Button variant="contained">Primary</Button>

      <Blocks
        blocks={blocks}
        type="Page"
      />

      <Footer
        {...navigation}
        categorySlugs={[['about-us']]}
        iconSlug="icons"
        wepublishLogo="hidden"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: onlinereportsTenant,
  });

const theme = onlinereportsTenant.createTheme();

describe('onlinereports tenant', () => {
  beforeAll(() => applyTenantTranslations(onlinereportsTenant));
  afterAll(() => resetTranslations());

  it('sets buttons in Inter on the onlinereports primary colour', () => {
    renderTenantPage();

    const button = screen.getByRole('button', { name: 'Primary' });

    expect(getComputedStyle(button).fontFamily).toContain('Inter');
    expect(getComputedStyle(button).backgroundColor).toBe(
      theme.palette.primary.main
    );
  });

  it('hides the pre title of title blocks', () => {
    renderTenantPage([
      mockTitleBlock({
        preTitle: 'Versteckter Vortitel',
        title: 'Wie Basel in zehn Jahren wohnen will',
      }),
    ]);

    expect(
      screen.getByRole('heading', {
        name: 'Wie Basel in zehn Jahren wohnen will',
      })
    ).toBeVisible();
    expect(screen.getByText('Versteckter Vortitel')).not.toBeVisible();
  });

  it('renders news teaser lists with a link to all news', () => {
    renderTenantPage([
      mockTeaserListBlock({
        blockStyle: 'News',
        title: 'News',
        teasers: [mockArticleTeaser({ title: 'Neuer Rheinsteg eröffnet' })],
      }),
    ]);

    expect(screen.getByRole('heading', { name: 'News' })).toBeInTheDocument();
    expect(screen.getByText('Neuer Rheinsteg eröffnet')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Weitere News ->' })
    ).toHaveAttribute('href', '/a/tag/news');
  });

  it('asks readers without a payment to support onlinereports', () => {
    const SubscriptionPage = () => {
      const { SubscriptionList } = useWebsiteBuilder();

      return (
        <SubscriptionList
          data={{ __typename: 'Query', userSubscriptions: [] }}
          loading={false}
          error={undefined}
          invoices={{ data: undefined, loading: false, error: undefined }}
          subscribeUrl="/mitmachen"
          onCancel={vi.fn()}
          onExtend={vi.fn()}
        />
      );
    };

    renderWithProviders(<SubscriptionPage />, { tenant: onlinereportsTenant });

    expect(
      screen.getByText(deOverridden.subscription.noActiveSubscriptions, {
        exact: false,
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', {
        name: deOverridden.subscription.subscribeNow,
      })
    ).toHaveAttribute('href', '/mitmachen');
  });
});
