import { screen } from '@testing-library/react';
import {
  mockBreakBlock,
  mockNavigations,
  mockTeaserSlotsBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';
import { t } from 'i18next';

import logo from './assets/logo.svg';
import logoBlue from './assets/logo_blue.svg';
import { staticImageSrc } from './assets/static-image';
import { TsriBreakBlockType } from './components/break-blocks/tsri-base-break-block';
import { TsriLayoutType } from './components/teaser-layouts/tsri-layout';
import { tsriTenant } from './tsri-tenant';

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

const renderTenantPage = (blocks: FullBlockFragment[] = [], asPath = '/') =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: tsriTenant,
    router: { pathname: '/', asPath },
  });

const theme = tsriTenant.createTheme();

const withoutMarkup = (value: string) => value.replace(/<[^>]+>/g, '').trim();

describe('tsri tenant', () => {
  beforeAll(() => applyTenantTranslations(tsriTenant));
  afterAll(() => resetTranslations());

  it('sets buttons in Hanken Grotesk on the tsri blue', () => {
    renderTenantPage();

    const button = screen.getByRole('button', { name: 'Primary' });

    expect(getComputedStyle(button).fontFamily).toContain('Hanken Grotesk');
    expect(getComputedStyle(button).backgroundColor).toBe(
      theme.palette.primary.main
    );
  });

  it('shows the black logo on the home page', () => {
    renderTenantPage([], '/');

    expect(screen.getByRole('img', { name: 'Tsüri' })).toHaveAttribute(
      'src',
      staticImageSrc(logo)
    );
  });

  it('shows the blue logo away from the home page', () => {
    renderTenantPage([], '/about');

    expect(screen.getByRole('img', { name: 'Tsüri' })).toHaveAttribute(
      'src',
      staticImageSrc(logoBlue)
    );
  });

  it('sets the "Von" of the teaser byline apart from the authors', () => {
    renderTenantPage([
      mockTeaserSlotsBlock({ blockStyle: TsriLayoutType.FullsizeImage }),
    ]);

    const [byline] = screen.getAllByText(
      withoutMarkup(t('teaser.author.text', { authors: '' }))
    );

    expect(byline.nextElementSibling).toHaveTextContent('Foobar, Foobar');
  });

  it('gives the attention catcher break block a black heading bar', () => {
    renderTenantPage([
      mockBreakBlock({
        blockStyle: TsriBreakBlockType.AttentionCatcher,
        text: 'Tsüri braucht dich',
      }),
    ]);

    expect(
      getComputedStyle(screen.getByText('Tsüri braucht dich')).backgroundColor
    ).toBe(theme.palette.common.black);
  });

  it('renders break blocks without the attention catcher style as plain break blocks', () => {
    renderTenantPage([mockBreakBlock({ text: 'Gut zu wissen' })]);

    expect(
      getComputedStyle(screen.getByText('Gut zu wissen')).backgroundColor
    ).not.toBe(theme.palette.common.black);
  });
});
