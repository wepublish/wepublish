import { screen } from '@testing-library/react';
import {
  mockNavigations,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import logo from './assets/logo.svg';
import logoClaim from './assets/logo-claim.svg';
import { staticImageSrc } from './assets/static-image';
import { CenterTextBlockStyle } from './block-style/centter-text';
import { hauptstadtTenant } from './hauptstadt-tenant';
import deOverriden from './locales/deOverriden.json';

const navigation = {
  data: { __typename: 'Query' as const, navigations: mockNavigations() },
  loading: false,
  slug: 'main',
  categorySlugs: [['pages']],
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
        iconSlug="icons"
        wepublishLogo="hidden"
      />
    </>
  );
};

const renderTenantPage = (blocks: FullBlockFragment[] = []) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: hauptstadtTenant,
  });

const theme = hauptstadtTenant.createTheme();

const withoutSpaces = (value: string) => value.replace(/,\s+/g, ',');

describe('hauptstadt tenant', () => {
  beforeAll(() => applyTenantTranslations(hauptstadtTenant));
  afterAll(() => resetTranslations());

  it('styles buttons with the hauptstadt typography and palette', () => {
    renderTenantPage();

    const button = screen.getByRole('button', { name: 'Primary' });

    expect(withoutSpaces(getComputedStyle(button).fontFamily)).toBe(
      theme.typography.button.fontFamily
    );
    expect(getComputedStyle(button).backgroundColor).toBe(
      theme.palette.primary.main
    );
  });

  it('shows the logo and the claim from the tenant library', () => {
    renderTenantPage();

    expect(screen.getByRole('img', { name: 'Hauptstadt' })).toHaveAttribute(
      'src',
      staticImageSrc(logo)
    );
    expect(
      screen.getByRole('img', { name: 'Neuer Berner Journalismus' })
    ).toHaveAttribute('src', staticImageSrc(logoClaim));
  });

  it('labels the subscribe link with the hauptstadt wording', () => {
    renderTenantPage();

    expect(
      screen.getByRole('link', {
        name: deOverriden.navbar.subscribe,
        hidden: true,
      })
    ).toHaveAttribute('href', '/mitmachen');
  });

  it('centers title blocks with the center text block style', () => {
    renderTenantPage([
      mockTitleBlock({
        blockStyle: CenterTextBlockStyle,
        title: 'Wie Bern in zehn Jahren wohnen will',
      }),
      mockTitleBlock({ title: 'Was der Gemeinderat plant' }),
    ]);

    expect(
      getComputedStyle(
        screen.getByRole('heading', {
          name: 'Wie Bern in zehn Jahren wohnen will',
        })
      ).textAlign
    ).toBe('center');
    expect(
      getComputedStyle(
        screen.getByRole('heading', { name: 'Was der Gemeinderat plant' })
      ).textAlign
    ).not.toBe('center');
  });
});
