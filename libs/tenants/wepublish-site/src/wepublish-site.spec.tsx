import { CSSProperties } from 'react';
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

  it('sets the page in the Archivo font', () => {
    renderTenantPage([]);

    expect(getComputedStyle(document.body).fontFamily).toContain('Archivo');
  });

  // Text styles of the Figma design (file "Website", frame "Fonts"), all sizes
  // scaled down by 20/22 so that Text is 1.25rem on desktop. The design only has
  // desktop sizes (lg and up); md is a step between them and the mobile sizes (xs).
  const H1 = {
    font: 'Bricolage Grotesque',
    weight: 800,
    lineHeight: 1.2,
    xs: 33,
    md: 46,
    lg: 60,
  };
  const H2 = {
    font: 'Bricolage Grotesque',
    weight: 800,
    lineHeight: 1.3,
    xs: 25,
    md: 34,
    lg: 42,
  };
  const H3 = {
    font: 'Bricolage Grotesque',
    weight: 600,
    lineHeight: 1.3,
    xs: 22,
    md: 26,
    lg: 29,
  };
  const H4 = {
    font: 'Bricolage Grotesque',
    weight: 600,
    lineHeight: 1.3,
    xs: 18,
    md: 20,
    lg: 22,
  };
  const Paragraph = {
    font: 'Archivo',
    weight: 400,
    lineHeight: 1.5,
    xs: 18,
    md: 22,
    lg: 27,
  };
  const Text = {
    font: 'Archivo',
    weight: 400,
    lineHeight: 1.5,
    xs: 16,
    md: 18,
    lg: 20,
  };
  const Mono = {
    font: 'Space Mono',
    weight: 400,
    lineHeight: 1.5,
    xs: 15,
    md: 16,
    lg: 16,
  };

  const rem = (px: number) => `${px / 16}rem`;

  it.each([
    ['h1', H1],
    ['h2', H2],
    ['h3', H3],
    ['h4', H4],
    ['subtitle1', Paragraph],
    ['subtitle2', Paragraph],
    ['body1', Text],
    ['body2', Text],
    ['blockTitlePreTitle', Text],
    ['blockBreakTitle', H2],
    ['blockBreakBody', Paragraph],
    ['blockQuote', H3],
    ['categoryLinkTitle', Mono],
    ['categoryAddressText', Text],
    ['teaserMeta', Mono],
  ] as const)('sets %s like the design', (variant, design) => {
    const { breakpoints, typography } = wepublishSiteTenant.createTheme();
    const md = `@media (min-width:${breakpoints.values.md}px)`;
    const lg = `@media (min-width:${breakpoints.values.lg}px)`;
    const style = typography[variant] as CSSProperties & {
      [md]?: CSSProperties;
      [lg]?: CSSProperties;
    };

    expect({
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      xs: style.fontSize,
      md: style[md]?.fontSize,
      lg: style[lg]?.fontSize,
    }).toEqual({
      fontFamily: expect.stringContaining(design.font),
      fontWeight: design.weight,
      lineHeight: design.lineHeight,
      letterSpacing: 0,
      xs: rem(design.xs),
      md: rem(design.md),
      lg: rem(design.lg),
    });
  });

  it('no longer uses Inter anywhere in the typography', () => {
    const { typography } = wepublishSiteTenant.createTheme();

    expect(JSON.stringify(typography)).not.toContain('Inter');
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
