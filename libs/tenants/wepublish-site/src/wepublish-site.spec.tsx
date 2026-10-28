import { screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockArticleTeaser,
  mockAuthor,
  mockBreakBlock,
  mockNavigations,
  mockTeaserSlotsBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import { staticImageSrc } from './assets/static-image';
import logo from './assets/wepublish-logo.svg';
import logoAlt from './assets/wepublish-logo-alt.svg';
import { WepBlockStyles } from './components/block-styles/wep-block-styles';
import { wepublishSiteTenant } from './wepublish-site-tenant';

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

const renderTenantPage = (blocks: FullBlockFragment[]) =>
  renderWithProviders(<TenantPage blocks={blocks} />, {
    tenant: wepublishSiteTenant,
  });

const backgroundsOf = (element: HTMLElement | null): string[] =>
  element ?
    [
      getComputedStyle(element).backgroundColor,
      ...backgroundsOf(element.parentElement),
    ]
  : [];

const primaryColor = wepublishSiteTenant.createTheme().palette.primary.main;

describe('We.Publish website tenant', () => {
  beforeAll(() => applyTenantTranslations(wepublishSiteTenant));
  afterAll(() => resetTranslations());

  it('sets the page in the Inter font', () => {
    renderTenantPage([]);

    expect(getComputedStyle(document.body).fontFamily).toContain('Inter');
  });

  it('shows the we.publish logo in the navbar and the light logo in the footer', () => {
    renderTenantPage([]);

    expect(
      screen
        .getAllByRole('img', { name: 'WePublish Logo' })
        .map(image => image.getAttribute('src'))
    ).toEqual([staticImageSrc(logo), staticImageSrc(logoAlt)]);
  });

  it('paints an attention catcher break block in the primary colour', () => {
    renderTenantPage([
      mockBreakBlock({
        blockStyle: WepBlockStyles.AttentionCatcher,
        text: 'Werde Teil von We.Publish',
      }),
    ]);

    expect(
      backgroundsOf(screen.getByText('Werde Teil von We.Publish'))
    ).toContain(primaryColor);
  });

  it('keeps a break block without the attention catcher style uncoloured', () => {
    renderTenantPage([mockBreakBlock({ text: 'Newsletter' })]);

    expect(backgroundsOf(screen.getByText('Newsletter'))).not.toContain(
      primaryColor
    );
  });

  it.each([
    WepBlockStyles.TeaserNews,
    WepBlockStyles.TeaserServices,
    WepBlockStyles.TeaserExpertise,
    WepBlockStyles.LogoWall,
  ])('renders the title and the teasers of %s teaser slots', blockStyle => {
    renderTenantPage([
      mockTeaserSlotsBlock({
        blockStyle,
        title: 'Unsere Angebote',
        teasers: [
          mockArticleTeaser({ title: 'Erster Teaser' }),
          mockArticleTeaser({ title: 'Zweiter Teaser' }),
        ],
      }),
    ]);

    expect(screen.getByText('Unsere Angebote')).toBeInTheDocument();
    expect(screen.getByText('Erster Teaser')).toBeInTheDocument();
    expect(screen.getByText('Zweiter Teaser')).toBeInTheDocument();
  });

  it('lists the teaser authors without a prefix', () => {
    renderTenantPage([
      mockTeaserSlotsBlock({
        blockStyle: WepBlockStyles.TeaserNews,
        teasers: [
          mockArticleTeaser({
            article: mockArticle({
              latest: mockArticleRevision({
                blocks: [],
                authors: [
                  mockArticleRevisionAuthor({
                    author: mockAuthor({ name: 'Anna Muster' }),
                  }),
                  mockArticleRevisionAuthor({
                    author: mockAuthor({ name: 'Beat Beispiel' }),
                  }),
                ],
              }),
            }),
          }),
        ],
      }),
    ]);

    expect(screen.getByText('Anna Muster, Beat Beispiel')).toBeInTheDocument();
  });
});
