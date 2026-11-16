// Centralized brand tokens for Courant's tenant theme
// Please refer to brand guidelines for more details on colors, typography, and layout.

// Shared heading faces — referenced from both `roles.heading` and `headings.<context>.face`
// so every heading in the theme traces back to one of these.
const pageHeadingFace = {
  fontFamily: 'var(--courant-display)',
  fontWeight: 500,
  lineHeight: 1,
  letterSpacing: '-0.0075em',
} as const;

// Non-editorial rich text overrides h3-h6 with a sans/bold face.
const richtextHeadingFace = {
  fontFamily: 'var(--courant-sans)',
  fontWeight: 700,
  lineHeight: 1.2,
  letterSpacing: '0',
} as const;

export const courantTokens = {
  colors: {
    // Primary Courant yellow; 500 is the main shade.
    courant: {
      50: '#fffde6',
      100: '#fffbcc',
      200: '#fef79f',
      300: '#fef36c',
      400: '#fdef3a',
      500: '#fdeb0b',
      600: '#cfc002',
      700: '#9d9101',
      800: '#6a6201',
      900: '#332f00',
      950: '#191700',
    },
    black: '#000',
    // Optional support colors; 400 and 700 are the main "light" and "dark" shades.
    warmGray: {
      50: '#f3f3f1',
      100: '#eaeae6',
      200: '#d3d3ca',
      300: '#bebeb1',
      400: '#aaa998',
      500: '#95947f',
      600: '#7b7a66',
      700: '#626151',
      800: '#404035',
      900: '#22211c',
      950: '#11110e',
    },
    border: { 200: '#d0d0ba' }, // Used for light borders only.
    alert: {
      400: '#f96658',
      500: '#e83d20',
      600: '#ba2f17',
    },
  },
  spacing: 4,
  breakpoints: { xs: 0, sm: 600, md: 900, lg: 1333, xl: 1536 },
  shape: {
    borderRadius: 4,
    buttonRadius: '1rem',
    buttonRadiusFallback: '0.5rem',
    buttonCornerShape: 'squircle',
    outlinedButtonBorder: '1px',
  },
  button: {
    // Padding in spacing units (see spacing token)
    padding: {
      small: { y: 2, x: 4 },
      medium: { y: 2, x: 4 },
      large: { y: 2, x: 4 },
    },
    iconGap: 1,
    transitionMs: 160,
    hoverLift: '-1px',
    focusRingWidth: '2px',
    focusRingOffset: '2px',
    disabledOpacity: 0.5,
  },
  typography: {
    fontSize: 14,
    htmlFontSize: 16,
    weights: { light: 400, regular: 400, medium: 400, bold: 700 },
    roles: {
      heading: pageHeadingFace,
      body: {
        fontFamily: 'var(--courant-sans)',
        fontWeight: 400,
        lineHeight: 1.5,
        letterSpacing: 'normal',
      },
      editorial: {
        fontFamily: 'var(--courant-editorial)',
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: 'normal',
      },
      ui: {
        fontFamily: 'var(--courant-sans)',
        fontWeight: 400,
        lineHeight: 1.2,
        letterSpacing: '0',
      },
      kicker: {
        fontFamily: 'var(--courant-kicker)',
        fontWeight: 400,
        lineHeight: 1,
        letterSpacing: '0.1em',
      },
      caption: {
        fontFamily: 'var(--courant-captions)',
        fontWeight: 400,
        lineHeight: 1.4,
        letterSpacing: '0.01em',
      },
    },
    headings: {
      // Page context — teaser titles, section headings, non-article H tags.
      page: {
        face: pageHeadingFace,
        h1: '3.75rem',
        h2: '2.75rem',
        h3: '2.1875rem',
        h4: '1.75rem',
        h5: '1.4rem',
        h6: '1.125rem',
      },
      // Article context — H tags inside the article body (inside EditorialRichTextBlock).
      // Same face as page; sizes diverge; spacing applied inside the editorial wrapper.
      article: {
        face: pageHeadingFace,
        h1: '3.75rem',
        h2: '2.75rem',
        h3: '1.25rem',
        h4: '1.125rem',
        h5: '1.125rem',
        h6: '1.125rem',
        spacing: {
          h1: { top: '1.5em', bottom: '0.5em' },
          h2: { top: '1.5em', bottom: '0.5em' },
          h3: { top: '1.5em', bottom: '0.65em' },
          h4: { top: '1.5em', bottom: '0.65em' },
          h5: { top: '1.5em', bottom: '0.65em' },
          h6: { top: '1.5em', bottom: '0.65em' },
        },
      },
      // Non-editorial rich text context — overrides h3-h6 with a sans/bold face.
      // Spacing applied inside RichTextBlockWrapper that is not editorial.
      richtext: {
        face: richtextHeadingFace,
        h3: '1.25rem',
        h4: '1.125rem',
        h5: '1.125rem',
        h6: '1.125rem',
        spacing: {
          h1: { top: '1.5em', bottom: '0.5em' },
          h2: { top: '1.5em', bottom: '0.5em' },
          h3: { top: '1.5em', bottom: '0.65em' },
          h4: { top: '1.5em', bottom: '0.65em' },
          h5: { top: '1.5em', bottom: '0.65em' },
          h6: { top: '1.5em', bottom: '0.65em' },
        },
      },
    },
    sizes: {
      subtitle1: '1.25rem',
      subtitle2: '0.875rem',
      body1: '1.125rem',
      body2: '0.875rem',
      editorialBody: '1.25rem',
      button: '1rem',
      caption: '0.85rem',
      overline: '0.75rem',
      teaserTitle: '1.625rem',
      teaserPretitle: '0.8rem',
      teaserLead: '1.125rem',
      teaserMeta: '0.75rem',
      articleAuthors: '1rem',
      peerInformation: '1rem',
      blockBreakTitle: '2.5rem',
      blockBreakBody: '1rem',
      blockQuote: '1.625rem',
      blockTitlePreTitle: '1rem',
      bannerTitle: '1.5rem',
      bannerText: '1rem',
      bannerCta: '1.25rem',
      footerLink: '1.25rem',
      navMenuItem: '3rem',
    },
    leading: { subtitle1: 1.4, bannerCta: 1.15 },
    spacing: {
      bodyBottom: 3,
      listItemBottom: 1,
      teaserTitleBottom: '0.35em',
      teaserLeadBottom: 3,
      teaserPretitlePadding: 0,
    },
  },
  layout: {
    pageMaxWidth: 1200,
    // Gutters use use spacing unit and are shared by Containers, navbar and footer.
    pageInline: { xs: 4, sm: 4, md: 6, lg: 6 },
    pageGap: { xs: 12, md: 16, lg: 20, xl: 20 },
    articleGap: 3,
    columnGap: { xs: 3, lg: 3, xl: 4 },
    footer: {
      contactGap: 2,
      contactPadding: 6,
      contactLinkGap: 1,
      rowGap: 10,
      desktopGap: 8,
      dividerWidth: '1px',
    },
    shell: { gap: 20, mainGap: 5, desktopMainGap: 10, navbarZIndex: 11 },
    blockGaps: {
      articleTitle: 8, // article title block (pretitle/title/lead) row-gap
      articleMeta: 6, // article authors wrapper: authors column vs date row-gap
      articleMetaAuthors: 2, // gap between stacked author chips inside the top row
      authorChip: 3, // gap between avatar and name/role column
      authorChipAvatar: 48, // avatar size (pixels !)
      teaserColumn: 8, // teaser grid/list/flex/slots column-gap
      teaserRow: 12, // teaser grid/list/flex/slots row-gap
      teaserWrapper: 6, // outer gap between title and grid (list/slots/slider)
      sliderInner: 10, // slider inner container
      sliderBalls: 2, // slider pagination balls
      flexColumn: 4, // nested flex block column-gap
      flexRow: 16, // nested flex block row-gap
      listicleItem: 20, // vertical gap between listicle items
      listicleInner: 4, // gap within a listicle item
      event: 8, // event block
      break: 8, // break block
      breakDesktop: 20, // break block desktop
    },
  },
} as const;

export type CourantTypographyRole = keyof typeof courantTokens.typography.roles;
