import { CSSProperties } from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import {
  mockArticle,
  mockArticleRevision,
  mockArticleRevisionAuthor,
  mockArticleTeaser,
  mockAuthor,
  mockBreakBlock,
  mockCustomTeaser,
  mockEvent,
  mockImage,
  mockEventTeaser,
  mockNavigations,
  mockQuoteBlock,
  mockTeaserSlotsBlock,
  mockTitleBlock,
  applyTenantTranslations,
  renderWithProviders,
  resetTranslations,
} from '@wepublish/mocks/website';
import {
  FullBlockFragment,
  FullBreakBlockFragment,
} from '@wepublish/website/api';
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
  // The title gets one more step for tablets (sm).
  const H1 = {
    font: 'Bricolage Grotesque',
    weight: 800,
    lineHeight: 1.2,
    xs: 33,
    sm: 40,
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
    const sm = `@media (min-width:${breakpoints.values.sm}px)`;
    const md = `@media (min-width:${breakpoints.values.md}px)`;
    const lg = `@media (min-width:${breakpoints.values.lg}px)`;
    const style = typography[variant] as CSSProperties & {
      [sm]?: CSSProperties;
      [md]?: CSSProperties;
      [lg]?: CSSProperties;
    };

    expect({
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      xs: style.fontSize,
      sm: style[sm]?.fontSize,
      md: style[md]?.fontSize,
      lg: style[lg]?.fontSize,
    }).toEqual({
      fontFamily: expect.stringContaining(design.font),
      fontWeight: design.weight,
      lineHeight: design.lineHeight,
      letterSpacing: 0,
      xs: rem(design.xs),
      sm: 'sm' in design ? rem(design.sm) : undefined,
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

  describe('attention catcher', () => {
    const attentionCatcher = (
      overrides: Partial<FullBreakBlockFragment> = {}
    ): FullBreakBlockFragment =>
      mockBreakBlock({
        blockStyle: WepBlockStyles.AttentionCatcher,
        text: 'Werde Teil von We.Publish',
        hideButton: false,
        linkText: 'Mehr erfahren',
        linkURL: '/demo',
        linkTarget: null,
        image: null,
        ...overrides,
      });

    it.each([
      [WepBlockStyles.AttentionCatcher, primaryColor],
      [
        WepBlockStyles.AttentionCatcherMint,
        wepublishSiteTenant.createTheme().palette.primary.light,
      ],
      [WepBlockStyles.AttentionCatcherRose, '#f3d5e1'],
      [WepBlockStyles.AttentionCatcherBlue, '#87f5fb'],
    ])('paints %s in its colour', (blockStyle, colour) => {
      renderTenantPage([attentionCatcher({ blockStyle })]);

      expect(
        backgroundsOf(
          screen.getByRole('heading', { name: 'Werde Teil von We.Publish' })
        )
      ).toContain(colour);
    });

    it('shows the title, the text and the button', () => {
      renderTenantPage([attentionCatcher()]);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Werde Teil von We.Publish',
        })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Mehr erfahren' })
      ).toHaveAttribute('href', '/demo');
    });

    it('shows the image from the editor next to the text', () => {
      renderTenantPage([
        attentionCatcher({ image: mockImage({ title: 'Media Makers Camp' }) }),
      ]);

      expect(
        screen.getByRole('img', { name: 'Media Makers Camp' })
      ).toBeInTheDocument();
    });

    it('works without an image', () => {
      renderTenantPage([attentionCatcher()]);

      expect(
        within(
          screen
            .getByRole('heading', { name: 'Werde Teil von We.Publish' })
            .closest('section') as HTMLElement
        ).queryByRole('img')
      ).not.toBeInTheDocument();
    });
  });

  it('keeps a break block without the attention catcher style uncoloured', () => {
    renderTenantPage([mockBreakBlock({ text: 'Newsletter' })]);

    expect(backgroundsOf(screen.getByText('Newsletter'))).not.toContain(
      primaryColor
    );
  });

  describe('title block', () => {
    const titleBlock = () =>
      mockTitleBlock({
        preTitle: 'We.Publish Foundation',
        title: 'Über uns',
        lead: 'Wir fördern die Medienvielfalt in der Schweiz.',
      });

    // The default test screen (1024px) gets the md sizes
    it('sets the title as the page heading in the size of H1', () => {
      renderTenantPage([titleBlock()]);

      const title = screen.getByRole('heading', { level: 1, name: 'Über uns' });

      expect(getComputedStyle(title).fontSize).toBe(`${H1.md}px`);
    });

    it('shows the pre-title as plain text above the title', () => {
      renderTenantPage([titleBlock()]);

      const preTitle = screen.getByText('We.Publish Foundation');

      expect(getComputedStyle(preTitle).fontSize).toBe(`${Text.md}px`);
      expect(backgroundsOf(preTitle)[0]).toMatch(
        /^(rgba\(0, 0, 0, 0\)|transparent|)$/
      );
    });

    it('shows the lead in the size of the paragraph', () => {
      renderTenantPage([titleBlock()]);

      expect(
        getComputedStyle(
          screen.getByText('Wir fördern die Medienvielfalt in der Schweiz.')
        ).fontSize
      ).toBe(`${Paragraph.md}px`);
    });
  });

  describe('break block without style', () => {
    const breakBlock = () =>
      mockBreakBlock({
        text: 'Als Stiftung fördern wir Medienvielfalt',
        hideButton: false,
        linkText: 'Mehr erfahren',
        linkURL: '/de/ueber-uns',
        image: mockImage({ title: 'Das Team' }),
      });

    // The default test screen (1024px) gets the md size
    it('sets the title in the size of H3', () => {
      renderTenantPage([breakBlock()]);

      expect(
        getComputedStyle(
          screen.getByRole('heading', {
            name: 'Als Stiftung fördern wir Medienvielfalt',
          })
        ).fontSize
      ).toBe(`${H3.md}px`);
    });

    it('shows the image, the title and the button', () => {
      renderTenantPage([breakBlock()]);

      expect(screen.getByRole('img', { name: 'Das Team' })).toBeInTheDocument();
      // The test router leaves out the locale prefix that Next.js adds to the links
      expect(
        screen.getByRole('link', { name: 'Mehr erfahren' })
      ).toHaveAttribute('href', expect.stringMatching(/\/ueber-uns$/));
    });
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

  describe('feature', () => {
    const paragraphs = (...texts: string[]) =>
      ({
        type: 'doc',
        content: texts.map(text => ({
          type: 'paragraph',
          content: [{ type: 'text', text }],
        })),
      }) as FullBreakBlockFragment['richText'];

    const featureBlock = (
      overrides: Partial<FullBreakBlockFragment> = {}
    ): FullBreakBlockFragment =>
      mockBreakBlock({
        blockStyle: WepBlockStyles.Feature,
        text: 'Alles, was Redaktionen zum Publizieren brauchen',
        richText: paragraphs(
          'Von der ersten Idee bis zur fertigen Ausgabe.',
          '#Publizieren #Crowdfunding #Newsletter',
          '#Abonnement #Member'
        ),
        hideButton: false,
        linkText: 'Mehr erfahren',
        linkURL: '/we-develop',
        linkTarget: null,
        image: mockImage({ title: 'Screenshot des Editors' }),
        ...overrides,
      });

    it('shows the title as a heading', () => {
      renderTenantPage([featureBlock()]);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Alles, was Redaktionen zum Publizieren brauchen',
        })
      ).toBeInTheDocument();
    });

    it('shows every word with a # in front as a tag', () => {
      renderTenantPage([featureBlock()]);

      expect(
        screen.getAllByRole('listitem').map(tag => tag.textContent)
      ).toEqual([
        'Publizieren',
        'Crowdfunding',
        'Newsletter',
        'Abonnement',
        'Member',
      ]);
    });

    it('shows the rest of the text as a paragraph', () => {
      renderTenantPage([featureBlock()]);

      expect(
        screen.getByText('Von der ersten Idee bis zur fertigen Ausgabe.')
      ).toBeInTheDocument();
      expect(screen.queryByText(/#/)).not.toBeInTheDocument();
    });

    it('shows the image and links the button', () => {
      renderTenantPage([featureBlock()]);

      expect(
        screen.getByRole('img', { name: 'Screenshot des Editors' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Mehr erfahren' })
      ).toHaveAttribute('href', '/we-develop');
    });

    it('leaves out the button when the editor hides it', () => {
      renderTenantPage([featureBlock({ hideButton: true })]);

      expect(
        screen.queryByRole('link', { name: 'Mehr erfahren' })
      ).not.toBeInTheDocument();
    });

    const imageSide = (title: string) =>
      screen
        .getByRole('heading', { name: title })
        .closest('section')
        ?.getAttribute('data-image');

    it('puts the image of features in a row alternately left and right, from the left again after another block', () => {
      renderTenantPage([
        featureBlock({ text: 'Erstes' }),
        featureBlock({ text: 'Zweites' }),
        featureBlock({ text: 'Drittes' }),
        mockQuoteBlock({ quote: 'Dazwischen', author: 'Jemand', image: null }),
        featureBlock({ text: 'Nach dem Zitat' }),
      ]);

      expect(
        ['Erstes', 'Zweites', 'Drittes', 'Nach dem Zitat'].map(imageSide)
      ).toEqual(['left', 'right', 'left', 'left']);
    });

    it('starts from the left again after a feature without image', () => {
      renderTenantPage([
        featureBlock({ text: 'Ohne Bild', image: null }),
        featureBlock({ text: 'Erstes mit Bild' }),
        featureBlock({ text: 'Zweites mit Bild' }),
      ]);

      expect(['Erstes mit Bild', 'Zweites mit Bild'].map(imageSide)).toEqual([
        'left',
        'right',
      ]);
    });

    it('sets a feature without image in the middle of the page', () => {
      renderTenantPage([featureBlock({ text: 'Ohne Bild', image: null })]);

      expect(imageSide('Ohne Bild')).toBe('none');
    });
  });

  describe('teaser cards', () => {
    const card = (title: string, label: string, url: string) =>
      mockCustomTeaser({
        title,
        preTitle: label,
        lead: null,
        contentUrl: url,
        openInNewTab: false,
        image: mockImage({ title: `Illustration ${label}` }),
      });

    const cards = () =>
      mockTeaserSlotsBlock({
        blockStyle: WepBlockStyles.TeaserCards,
        title: null,
        teasers: [
          card(
            'Wir begleiten (neue) Medien in Gründung und Wandel',
            'We.Start',
            '/de/start'
          ),
          card(
            'Wir sind ein Netzwerk, das gemeinsam lernt',
            'We.Share',
            '/de/share'
          ),
        ],
      });

    it('shows each card with its title on the mint background', () => {
      renderTenantPage([cards()]);

      const title = screen.getByRole('heading', {
        name: 'Wir sind ein Netzwerk, das gemeinsam lernt',
      });

      expect(
        screen.getByRole('heading', {
          name: 'Wir begleiten (neue) Medien in Gründung und Wandel',
        })
      ).toBeInTheDocument();
      expect(backgroundsOf(title)).toContain(
        wepublishSiteTenant.createTheme().palette.primary.light
      );
    });

    it('shows the illustration of each card', () => {
      renderTenantPage([cards()]);

      expect(
        screen.getByRole('img', { name: 'Illustration We.Start' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: 'Illustration We.Share' })
      ).toBeInTheDocument();
    });

    // The test router leaves out the locale prefix that Next.js adds to the links
    it('links the button of each card, labelled with the pre-title', () => {
      renderTenantPage([cards()]);

      expect(screen.getByRole('link', { name: 'We.Start' })).toHaveAttribute(
        'href',
        expect.stringMatching(/\/start$/)
      );
      expect(screen.getByRole('link', { name: 'We.Share' })).toHaveAttribute(
        'href',
        expect.stringMatching(/\/share$/)
      );
    });
  });

  describe('latest news', () => {
    const article = (title: string, author: string, publishedAt: string) =>
      mockArticleTeaser({
        title,
        image: mockImage({ title: `Bild ${title}` }),
        article: mockArticle({
          publishedAt,
          latest: mockArticleRevision({
            blocks: [],
            authors: [
              mockArticleRevisionAuthor({
                author: mockAuthor({ name: author }),
              }),
            ],
          }),
        }),
      });

    const latestNews = () =>
      mockTeaserSlotsBlock({
        blockStyle: WepBlockStyles.LatestNews,
        title: 'Aktuelles von We.Publish',
        teasers: [
          article(
            'Hackathon bei der Hauptstadt',
            'Ramona Sprenger',
            '2026-09-08T10:00:00.000Z'
          ),
          article(
            'ganzgraz: We.Publish wächst nach Österreich',
            'Michael Scheurer',
            '2025-04-19T10:00:00.000Z'
          ),
          mockCustomTeaser({
            title: null,
            preTitle: 'Alle anzeigen',
            lead: null,
            contentUrl: '/de/aktuelles',
            image: null,
          }),
        ],
      });

    it('shows the title of the block as a heading', () => {
      renderTenantPage([latestNews()]);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Aktuelles von We.Publish',
        })
      ).toBeInTheDocument();
    });

    it('shows each article with its image, title, authors and date', () => {
      renderTenantPage([latestNews()]);

      const hackathon = screen.getByRole('article', {
        name: 'Hackathon bei der Hauptstadt',
      });

      expect(
        within(hackathon).getByRole('img', {
          name: 'Bild Hackathon bei der Hauptstadt',
        })
      ).toBeInTheDocument();
      expect(hackathon).toHaveTextContent(
        'Ramona Sprenger, 08. September 2026'
      );
    });

    it('links each article', () => {
      renderTenantPage([latestNews()]);

      expect(
        screen.getByRole('link', { name: /Hackathon bei der Hauptstadt/ })
      ).toHaveAttribute('href', expect.stringMatching(/.+/));
    });

    it('turns an entry without image into the button to all articles', () => {
      renderTenantPage([latestNews()]);

      expect(
        screen.getByRole('link', { name: 'Alle anzeigen' })
      ).toHaveAttribute('href', expect.stringMatching(/\/aktuelles$/));
      expect(screen.getAllByRole('article')).toHaveLength(2);
    });
  });

  describe('network news', () => {
    const news = (medium: string, title: string, date: string, url: string) =>
      mockCustomTeaser({
        title,
        preTitle: null,
        lead: date,
        contentUrl: url,
        openInNewTab: true,
        image: mockImage({ title: medium, description: null }),
      });

    const networkNews = () =>
      mockTeaserSlotsBlock({
        blockStyle: WepBlockStyles.NetworkNews,
        title: 'Neues aus dem Netzwerk',
        teasers: [
          news(
            'Hauptstadt',
            'Launcht Abo Plus',
            '19. April 2025',
            'https://www.hauptstadt.be/'
          ),
          news(
            'Reflekt',
            'Braucht Unterstützung',
            '19. April 2025',
            'https://reflekt.ch/'
          ),
        ],
      });

    it('shows the title of the block as a heading', () => {
      renderTenantPage([networkNews()]);

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Neues aus dem Netzwerk',
        })
      ).toBeInTheDocument();
    });

    // H4 below the H3 of "Aktuelles von We.Publish"
    it('sets its title smaller than the title of the news of We.Publish', () => {
      renderTenantPage([
        mockTeaserSlotsBlock({
          blockStyle: WepBlockStyles.LatestNews,
          title: 'Aktuelles von We.Publish',
          teasers: [],
        }),
        networkNews(),
      ]);

      const fontSize = (name: string) =>
        parseFloat(
          getComputedStyle(screen.getByRole('heading', { name })).fontSize
        );

      expect(fontSize('Neues aus dem Netzwerk')).toBeLessThan(
        fontSize('Aktuelles von We.Publish')
      );
    });

    it('shows each news with the logo of the medium, its title and date', () => {
      renderTenantPage([networkNews()]);

      const news = screen.getByRole('article', { name: 'Launcht Abo Plus' });

      expect(
        within(news).getByRole('img', { name: 'Hauptstadt' })
      ).toBeInTheDocument();
      expect(news).toHaveTextContent('19. April 2025');
    });

    it('links each news to the medium', () => {
      renderTenantPage([networkNews()]);

      const link = screen.getByRole('link', { name: /Launcht Abo Plus/ });

      expect(link).toHaveAttribute('href', 'https://www.hauptstadt.be/');
      expect(link).toHaveAttribute('target', '_blank');
    });

    // The image from the editor is the whole tile: the logo on its colour
    it('fills the tile with the image from the editor', () => {
      renderTenantPage([networkNews()]);

      expect(
        getComputedStyle(screen.getByRole('img', { name: 'Hauptstadt' }))
          .objectFit
      ).toBe('cover');
    });
  });

  describe('quote', () => {
    const quote = (image: ReturnType<typeof mockImage> | null) =>
      mockQuoteBlock({
        quote: 'Das spart uns schlichtweg Zeit und Geld.',
        author: 'Jan Amsler, Co-Chefredaktor OnlineReports',
        image,
      });

    it('shows the quote', () => {
      renderTenantPage([quote(null)]);

      expect(
        screen
          .getByText('Das spart uns schlichtweg Zeit und Geld.')
          .closest('blockquote')
      ).toBeInTheDocument();
    });

    it('splits the author into name and role at the first comma', () => {
      renderTenantPage([quote(null)]);

      expect(screen.getByText('Jan Amsler')).toBeInTheDocument();
      expect(
        screen.getByText('Co-Chefredaktor OnlineReports')
      ).toBeInTheDocument();
    });

    it('shows only the name when the author has no role', () => {
      renderTenantPage([
        mockQuoteBlock({ quote: 'Gut.', author: 'Jan Amsler', image: null }),
      ]);

      expect(screen.getByText('Jan Amsler')).toBeInTheDocument();
    });

    it('shows the portrait next to the name when there is one', () => {
      renderTenantPage([quote(mockImage({ title: 'Porträt Jan Amsler' }))]);

      expect(
        screen.getByRole('img', { name: 'Porträt Jan Amsler' })
      ).toBeInTheDocument();
    });

    it('leaves out the portrait when there is none', () => {
      renderTenantPage([quote(null)]);

      expect(
        within(
          screen.getByText('Jan Amsler').closest('figure') as HTMLElement
        ).queryByRole('img')
      ).not.toBeInTheDocument();
    });
  });

  describe('event list', () => {
    const event = (name: string, location: string) =>
      mockEventTeaser({
        title: null,
        image: null,
        event: mockEvent({
          name,
          location,
          url: `/de/event/${name.toLowerCase().replaceAll(' ', '-')}`,
          image: mockImage({ title: `Bild ${name}` }),
          startsAt: new Date(2026, 9, 17).toISOString(),
          endsAt: new Date(2026, 9, 19).toISOString(),
        }),
      });

    const eventList = () =>
      mockTeaserSlotsBlock({
        blockStyle: WepBlockStyles.EventList,
        title: 'Events',
        teasers: [
          event('Media Makers Camp', 'Ligerz, Bern'),
          event('Medien Austausch', 'online'),
          mockCustomTeaser({
            title: null,
            preTitle: 'Alle anzeigen',
            lead: null,
            contentUrl: '/de/event',
            image: null,
          }),
        ],
      });

    it('shows the title of the block and the button to all events', () => {
      renderTenantPage([eventList()]);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Events' })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', { name: 'Alle anzeigen' })
      ).toHaveAttribute('href', expect.stringMatching(/\/event$/));
      expect(screen.getAllByRole('article')).toHaveLength(2);
    });

    it('shows each event with its image, name, date and place', () => {
      renderTenantPage([eventList()]);

      const camp = screen.getByRole('article', { name: 'Media Makers Camp' });

      expect(
        within(camp).getByRole('img', { name: 'Bild Media Makers Camp' })
      ).toBeInTheDocument();
      expect(camp).toHaveTextContent('17.–19. Oktober 2026');
      expect(camp).toHaveTextContent('Ligerz, Bern');
    });

    it('links each event to its page', () => {
      renderTenantPage([eventList()]);

      expect(
        screen.getByRole('link', { name: /Media Makers Camp/ })
      ).toHaveAttribute('href', expect.stringMatching(/media-makers-camp$/));
    });
  });

  describe('offers', () => {
    const offer = (
      title: string,
      lead: string,
      url: string,
      overrides: Partial<Parameters<typeof mockCustomTeaser>[0]> = {}
    ) =>
      mockCustomTeaser({
        title,
        lead,
        preTitle: null,
        contentUrl: url,
        image: null,
        ...overrides,
      });

    const offers = () =>
      mockTeaserSlotsBlock({
        blockStyle: WepBlockStyles.Offers,
        title: 'Aktuelle Angebote',
        teasers: [
          offer(
            'Fundraising',
            'Wir übernehmen den grössten Teil des Fundraising-Prozesses.',
            '/de/fundraising',
            { image: mockImage({ title: 'Bild Fundraising' }) }
          ),
          offer(
            'KI-Werkzeuge',
            'KI-gestützte Werkzeuge für Recherche und Textarbeit.',
            '/de/ki',
            { preTitle: 'Zu den Werkzeugen' }
          ),
        ],
      });

    it('shows the title of the block and each offer with its text', () => {
      renderTenantPage([offers()]);

      expect(
        screen.getByRole('heading', { level: 2, name: 'Aktuelle Angebote' })
      ).toBeInTheDocument();

      const fundraising = screen.getByRole('article', { name: 'Fundraising' });

      expect(fundraising).toHaveTextContent(
        'Wir übernehmen den grössten Teil des Fundraising-Prozesses.'
      );
    });

    it('shows the image of an offer only when it has one', () => {
      renderTenantPage([offers()]);

      expect(
        within(screen.getByRole('article', { name: 'Fundraising' })).getByRole(
          'img',
          { name: 'Bild Fundraising' }
        )
      ).toBeInTheDocument();
      expect(
        within(
          screen.getByRole('article', { name: 'KI-Werkzeuge' })
        ).queryByRole('img')
      ).not.toBeInTheDocument();
    });

    it('links the button of each offer, "Mehr erfahren" unless the pre-title says otherwise', () => {
      renderTenantPage([offers()]);

      expect(
        within(screen.getByRole('article', { name: 'Fundraising' })).getByRole(
          'link',
          { name: 'Mehr erfahren' }
        )
      ).toHaveAttribute('href', expect.stringMatching(/\/fundraising$/));
      expect(
        within(screen.getByRole('article', { name: 'KI-Werkzeuge' })).getByRole(
          'link',
          { name: 'Zu den Werkzeugen' }
        )
      ).toHaveAttribute('href', expect.stringMatching(/\/ki$/));
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
