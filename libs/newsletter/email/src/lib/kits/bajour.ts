/**
 * Bajour's Basel Briefing.
 *
 * Every value here was read off the archived issue of 6 November 2026
 * (`archiv.apps.bajour.ch/api/campaigns/2be0ec6886/html`), a Mailchimp classic
 * template: a 600px column on #FAFAFA, Georgia at 20px/125%, 18px insets and 9px
 * between blocks.
 *
 * Only the shared blocks so far. Bajour's own — the regional sections, the
 * question of the day, the ad box, the articles of the day — are still to come,
 * and `tint` and `highlight` already hold the card and ad colours they will use.
 */
import type { NewsletterKit } from '../kit';
import type { NewsletterTheme } from '../theme';

const serif = 'Georgia, Times, "Times New Roman", serif';
const sans = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

const color = {
  /** `#bodyTable` and the preheader and footer bands. */
  page: '#FAFAFA',
  body: '#FFFFFF',
  text: '#202020',
  /** Bajour pink — links and buttons. */
  brand: '#FF0D63',
  /** Peach — the «Basler*in des Tages» card. */
  tint: '#FEDDD2',
  /** Green — the ad box. */
  highlight: '#A9EEA7',
  link: '#FF0D63',
  /** The template's 2px dividers and the body's bottom border. */
  rule: '#EAEAEA',
  /** Preheader and legal small print. */
  muted: '#656565',
};

export const bajourTheme: NewsletterTheme = {
  font: { body: serif, ui: sans },
  color: {
    page: color.page,
    body: color.body,
    text: color.text,
    brand: color.brand,
    tint: color.tint,
    highlight: color.highlight,
    link: color.link,
    rule: color.rule,
  },
  size: {
    /** `.mcnTextContent` */
    body: '20px',
    /** `h3` */
    heading: '20px',
  },
  lineHeight: { body: '1.25', heading: '1.25' },
  space: {
    /** `.mcnTextContent` pads 18px on both sides. */
    gutter: '18px',
    /** Not offered — the template has one inset. Equal to `gutter` so a
     *  document carrying it anyway still lines up. */
    introGutter: '18px',
    noGutter: '0px',
    /** A caption sits one block-gap under its image. */
    tight: '9px',
    /** `.mcnTextBlockInner` 9px above, `.mcnTextContent` 9px below. */
    block: '9px',
    /** `p { margin: 10px 0 }` */
    paragraph: '10px',
    section: '18px',
  },
  /** Unused until bajour has a teaser of its own; sized to the 600px grid. */
  bigTeaser: {
    imageWidth: 176,
    frameWidth: 0,
    imageColumnPercent: '33.333333%',
    textColumnPercent: '66.666667%',
  },
  /** `.templateContainer { max-width: 600px }` */
  contentWidth: 600,
  mobileBreakpoint: 480,

  /** Section titles are `h3`: 20px bold Georgia in the text colour. */
  heading: { fontSize: '20px', color: color.text },
  /** Captions are an `h4` in an `em`: Arial 14px, centred. */
  caption: {
    fontFamily: sans,
    fontSize: '14px',
    lineHeight: '1.25',
    color: color.text,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  /** `.mcnButtonContentContainer` and `.mcnButton`. */
  button: {
    background: color.brand,
    color: '#FFFFFF',
    fontFamily: sans,
    fontSize: '16px',
    padding: '18px',
    radius: '4px',
    align: 'center',
  },
  /** `.mcnDividerContent` inside an 18px pad. */
  divider: { width: '2px', color: color.rule, space: '18px' },
  /** «06.11.26 | Online lesen»: the `h4` of the preheader band. */
  meta: {
    fontFamily: sans,
    fontSize: '14px',
    color: color.text,
    background: color.page,
  },
  /**
   * «Basel Briefing - der tägliche Newsletter mit ❤️ von Bajour.» in white on
   * a black highlight, centred, then the legal lines in the grey footer band.
   */
  footer: {
    background: color.body,
    titleSize: '22px',
    titleColor: '#FFFFFF',
    titleHighlight: '#000000',
    color: color.text,
    textSize: '20px',
    linkColor: color.link,
    align: 'center',
    legal: {
      fontFamily: sans,
      fontSize: '10px',
      color: color.muted,
      linkColor: color.muted,
      background: color.page,
    },
  },
};

export const bajourKit: NewsletterKit = {
  id: 'bajour',
  theme: bajourTheme,
  blocks: ['meta', 'heading', 'text', 'image', 'button', 'divider', 'footer'],
  gutters: ['article', 'none'],
  defaultGutter: {
    rubric: 'article',
    teaser: 'article',
    heading: 'article',
    text: 'article',
    image: 'article',
    button: 'article',
    panel: 'article',
    meta: 'article',
    divider: 'article',
    footer: 'article',
  },
};
