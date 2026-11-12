import { CSSProperties } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockArticleTeaser,
  mockAuthor,
  mockBreakBlock,
  mockCustomTeaser,
  mockImage,
  mockNavigations,
  mockTeaserSlotsBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import { FullBlockFragment } from '@wepublish/website/api';
import { useWebsiteBuilder } from '@wepublish/website/builder';

import heroIllustration from './assets/hero-illustration.webp';
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

  describe('hero', () => {
    const heroBlock = (image: ReturnType<typeof mockImage> | null = null) =>
      mockBreakBlock({
        blockStyle: WepBlockStyles.Hero,
        text: 'Das Ökosystem unabhängiger Medien.',
        hideButton: false,
        linkText: 'Demo buchen',
        linkURL: '/demo',
        image,
      });

    const heroIllustrationImage = () =>
      document.querySelector(`img[src="${staticImageSrc(heroIllustration)}"]`);

    it('shows the hero text as the page heading on the primary colour', () => {
      renderTenantPage([heroBlock()]);

      const heading = screen.getByRole('heading', {
        level: 1,
        name: 'Das Ökosystem unabhängiger Medien.',
      });

      expect(heading).toHaveClass('MuiTypography-h1');
      expect(backgroundsOf(heading)).toContain(primaryColor);
    });

    it('links the hero button to the url from the editor', () => {
      renderTenantPage([heroBlock()]);

      expect(screen.getByRole('link', { name: 'Demo buchen' })).toHaveAttribute(
        'href',
        '/demo'
      );
    });

    it('shows the we.publish illustration when the editor sets no image', () => {
      renderTenantPage([heroBlock()]);

      expect(heroIllustrationImage()).toBeInTheDocument();
    });

    it('shows the image from the editor instead of the illustration', () => {
      renderTenantPage([heroBlock(mockImage({ title: 'Redaktionsbild' }))]);

      expect(heroIllustrationImage()).not.toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: 'Redaktionsbild' })
      ).toBeInTheDocument();
    });

    it('lists the hero links with their title and a button to their page', () => {
      renderTenantPage([
        mockTeaserSlotsBlock({
          blockStyle: WepBlockStyles.HeroLinks,
          title: null,
          teasers: [
            mockCustomTeaser({
              title: 'Gründen & Transformieren',
              preTitle: 'We.Start',
              lead: null,
              contentUrl: '/we-start',
            }),
            mockCustomTeaser({
              title: 'Digitale Infrastruktur',
              preTitle: 'We.Develop',
              lead: null,
              contentUrl: '/we-develop',
            }),
          ],
        }),
      ]);

      expect(
        screen.getByRole('heading', { name: 'Gründen & Transformieren' })
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'We.Start' })).toHaveAttribute(
        'href',
        '/we-start'
      );
      expect(screen.getByRole('link', { name: 'We.Develop' })).toHaveAttribute(
        'href',
        '/we-develop'
      );
      expect(
        backgroundsOf(screen.getByText('Digitale Infrastruktur'))
      ).toContain(primaryColor);
    });
  });

  describe('logo band', () => {
    const logo = (title: string, contentUrl: string) =>
      mockCustomTeaser({
        title: null,
        preTitle: null,
        lead: null,
        contentUrl,
        openInNewTab: true,
        image: mockImage({ title, description: null }),
      });

    const logoBand = () =>
      mockTeaserSlotsBlock({
        blockStyle: WepBlockStyles.LogoBand,
        title: 'Für und mit unabhängigen Medien',
        teasers: [
          logo('Bajour', 'https://bajour.ch/'),
          logo('Tsüri', 'https://tsri.ch/'),
          mockCustomTeaser({
            title: null,
            preTitle: 'Mehr erfahren',
            lead: null,
            contentUrl: '/netzwerk',
            image: null,
          }),
        ],
      });

    it('shows the title on the dark background', () => {
      renderTenantPage([logoBand()]);

      const title = screen.getByRole('heading', {
        name: 'Für und mit unabhängigen Medien',
      });

      expect(backgroundsOf(title)).toContain(
        wepublishSiteTenant.createTheme().palette.primary.dark
      );
    });

    it('links every logo once to its medium, in a new tab', () => {
      renderTenantPage([logoBand()]);

      const bajour = screen.getByRole('link', { name: 'Bajour' });

      expect(bajour).toHaveAttribute('href', 'https://bajour.ch/');
      expect(bajour).toHaveAttribute('target', '_blank');
      expect(screen.getByRole('link', { name: 'Tsüri' })).toHaveAttribute(
        'href',
        'https://tsri.ch/'
      );
    });

    it('keeps the copy for the endless loop away from screen readers and the keyboard', () => {
      renderTenantPage([logoBand()]);

      const copies = Array.from(
        document.querySelectorAll('a[href="https://bajour.ch/"]')
      );

      expect(copies).toHaveLength(2);
      expect(copies[1].closest('[aria-hidden="true"]')).not.toBeNull();
      expect(copies[1]).toHaveAttribute('tabindex', '-1');
    });

    it('does not open a logo when the band was dragged', () => {
      renderTenantPage([logoBand()]);

      const bajour = screen.getByRole('link', { name: 'Bajour' });

      fireEvent.pointerDown(bajour, { clientX: 300, button: 0 });
      fireEvent.pointerMove(bajour, { clientX: 200, buttons: 1 });
      fireEvent.pointerUp(bajour, { clientX: 200 });

      expect(fireEvent.click(bajour)).toBe(false);
    });

    it('opens a logo on a plain click', () => {
      renderTenantPage([logoBand()]);

      const bajour = screen.getByRole('link', { name: 'Bajour' });

      fireEvent.pointerDown(bajour, { clientX: 300, button: 0 });
      fireEvent.pointerUp(bajour, { clientX: 300 });

      expect(fireEvent.click(bajour)).toBe(true);
    });

    it('names a logo link after the medium when the image has no title', () => {
      renderTenantPage([
        mockTeaserSlotsBlock({
          blockStyle: WepBlockStyles.LogoBand,
          title: null,
          teasers: [
            mockCustomTeaser({
              title: null,
              preTitle: null,
              contentUrl: 'https://www.zwoelf.ch/',
              image: mockImage({ title: null, description: null }),
            }),
          ],
        }),
      ]);

      expect(
        screen.getByRole('link', { name: 'zwoelf.ch' })
      ).toBeInTheDocument();
    });

    it('turns an entry without image into the button next to the title', () => {
      renderTenantPage([logoBand()]);

      expect(
        screen.getByRole('link', { name: 'Mehr erfahren' })
      ).toHaveAttribute('href', '/netzwerk');
      expect(document.querySelectorAll('a[href="/netzwerk"]')).toHaveLength(1);
    });
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
