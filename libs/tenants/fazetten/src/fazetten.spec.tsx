import { screen } from '@testing-library/react';
import {
  mockArticleTeaser,
  mockNavigations,
  mockTeaserSlotsBlock,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { FazettenBlockStyles } from './components/block-styles/fazetten-block-styles';
import { fazettenTenant } from './fazetten-tenant';
import deOverriden from './locales/deOverriden.json';

const SampleBlocks = ({ blocks }: { blocks: FullBlockFragment[] }) => {
  const {
    blocks: { Blocks },
  } = useWebsiteBuilder();

  return (
    <Blocks
      blocks={blocks}
      type="Page"
    />
  );
};

const SampleNavbar = () => {
  const { Navbar } = useWebsiteBuilder();

  return (
    <Navbar
      data={{ __typename: 'Query', navigations: mockNavigations() }}
      loading={false}
      slug="main"
      categorySlugs={[['categories', 'about-us']]}
      headerSlug="header"
      iconSlug="icons"
      hasRunningSubscription={false}
      hasUnpaidInvoices={false}
    />
  );
};

const renderBlocks = (blocks: FullBlockFragment[]) =>
  renderWithProviders(<SampleBlocks blocks={blocks} />, {
    tenant: fazettenTenant,
  });

const titleWrapper = (title: string) =>
  screen.getByRole('heading', { name: title }).parentElement as HTMLElement;

describe('Fazetten tenant', () => {
  beforeAll(() => applyTenantTranslations(fazettenTenant));
  afterAll(() => resetTranslations());

  it('asks readers to support fazetten in the navbar', () => {
    renderWithProviders(<SampleNavbar />, { tenant: fazettenTenant });

    expect(
      screen.getByRole('link', { name: deOverriden.navbar.subscribe })
    ).toBeInTheDocument();
  });

  it('separates a title block with extra spacing by a top border', () => {
    renderBlocks([
      mockTitleBlock({
        blockStyle: FazettenBlockStyles.ExtraSpacing,
        title: 'Was uns zusammenhält',
      }),
    ]);

    expect(
      getComputedStyle(titleWrapper('Was uns zusammenhält')).borderTopStyle
    ).toBe('solid');
  });

  it('keeps a title block without extra spacing borderless', () => {
    renderBlocks([mockTitleBlock({ title: 'Was uns zusammenhält' })]);

    expect(
      getComputedStyle(titleWrapper('Was uns zusammenhält')).borderTopStyle
    ).not.toBe('solid');
  });

  it('shows only the logos of the logo wall teasers, not their leads', () => {
    renderBlocks([
      mockTeaserSlotsBlock({
        blockStyle: FazettenBlockStyles.LogoWall,
        title: 'Unsere Partner',
        teasers: [
          mockArticleTeaser({ title: 'Partner A', lead: 'Partner Lead' }),
          mockArticleTeaser({ title: 'Partner B', lead: 'Partner Lead' }),
        ],
      }),
    ]);

    expect(screen.getByRole('link', { name: /Partner A/ })).toBeVisible();
    expect(screen.getByRole('link', { name: /Partner B/ })).toBeVisible();

    for (const lead of screen.getAllByText('Partner Lead')) {
      expect(lead).not.toBeVisible();
    }
  });
});
