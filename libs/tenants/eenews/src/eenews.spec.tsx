import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockBreakBlock,
  mockMemberPlan,
  mockNavigations,
  mockTeaserSlotsBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { t } from 'i18next';

import logo from './assets/ee-news-logo.png';
import { staticImageSrc } from './assets/static-image';
import { EeNewsBlockType } from './components/block-styles/eenews-block-styles';
import { eenewsTenant } from './eenews-tenant';

const navigation = {
  data: { __typename: 'Query' as const, navigations: mockNavigations() },
  loading: false,
  slug: 'main',
  categorySlugs: [['categories', 'about']],
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
        wepublishLogo="hidden"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: eenewsTenant,
  });

const theme = eenewsTenant.createTheme();

const withoutSpaces = (value: string) => value.replace(/,\s+/g, ',');

describe('eenews tenant', () => {
  beforeAll(() => applyTenantTranslations(eenewsTenant));
  afterAll(() => resetTranslations());

  it('styles buttons with the eenews typography and palette', () => {
    renderTenantPage();

    const button = screen.getByRole('button', { name: 'Primary' });

    expect(withoutSpaces(getComputedStyle(button).fontFamily)).toBe(
      theme.typography.button.fontFamily
    );
    expect(getComputedStyle(button).backgroundColor).toBe(
      theme.palette.primary.main
    );
  });

  it('shows the logo in the navbar and the footer', () => {
    renderTenantPage();

    expect(
      screen
        .getAllByRole('img', { name: 'ee-news' })
        .map(image => image.getAttribute('src'))
    ).toEqual([staticImageSrc(logo), staticImageSrc(logo)]);
  });

  it('renders the article support break block as a callout', () => {
    renderTenantPage([
      mockBreakBlock({
        blockStyle: EeNewsBlockType.ArticleSupportCallout,
        text: 'Unterstützen Sie unabhängigen Energiejournalismus',
      }),
    ]);

    expect(screen.getByRole('complementary')).toHaveTextContent(
      'Unterstützen Sie unabhängigen Energiejournalismus'
    );
  });

  it('renders dossier teaser slots with a link to all dossiers', () => {
    renderTenantPage([
      mockTeaserSlotsBlock({
        blockStyle: EeNewsBlockType.DossierGrid,
        title: 'Dossiers zur Energiewende',
        teasers: [mockArticleTeaser({ title: 'Pumpspeicher im Wallis' })],
      }),
    ]);

    expect(screen.getByText('Dossiers zur Energiewende')).toBeInTheDocument();
    expect(screen.getByText('Pumpspeicher im Wallis')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Alle Dossiers →' })
    ).toHaveAttribute('href', '/a/tag');
  });

  it('shows the yearly price on every member plan', () => {
    const MemberPlans = () => {
      const { MemberPlanPicker } = useWebsiteBuilder();

      return (
        <MemberPlanPicker
          memberPlans={[
            mockMemberPlan({ name: 'Fachabo' }),
            mockMemberPlan({ name: 'Gönnerabo' }),
          ]}
          onChange={vi.fn()}
        />
      );
    };

    renderWithProviders(<MemberPlans />, { tenant: eenewsTenant });
    const prices = screen.getAllByText(
      t('subscribe.memberplan.price', {
        amountPerMonthMin: 500,
        yearlyPrice: 'CHF 60.-',
      })
    );

    expect(prices).toHaveLength(2);
    prices.forEach(price => expect(price).toBeVisible());
  });
});
