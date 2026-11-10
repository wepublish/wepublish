/**
 * ee-news.ch.
 *
 * Every value here was read off the sent issue "Die Unterschätzten –
 * ee-news.ch Newsletter 13.8.26" (Mailchimp campaign 6e2162b16f), not invented.
 * That issue is the layout this kit reproduces, and `eenews-issue.html` in
 * `__snapshots__` pins it.
 */
import type { NewsletterKit } from '../kit';
import type { NewsletterTheme } from '../theme';

const font = '"DM Sans", Helvetica, Arial, sans-serif';

const color = {
  /** Warm cream behind the 660px column. */
  page: '#f8f5ee',
  body: '#ffffff',
  text: '#000000',
  /** Brand blue — kickers, teaser headlines, the ee-news wordmark. */
  brand: '#195a7d',
  /** Pale blue — rubric bars and the frame around big-teaser images. */
  tint: '#f0faff',
  /** Pale green — the "Gewusst?" style highlight panel. */
  highlight: '#f8fff5',
  /** Body links: near-black and underlined, per `.mceText a`. */
  link: '#252525',
  rule: '#d0d0d0',
};

export const eenewsTheme: NewsletterTheme = {
  font: {
    /** The template's house font; the fallback is what most clients actually use. */
    body: font,
    ui: font,
  },
  color,
  size: {
    /** `.mceText p` — 15px/1.5 is the body setting for the whole issue. */
    body: '15px',
    /** `.mceText h4` — rubric bars and big-teaser headlines. */
    heading: '20px',
  },
  lineHeight: {
    body: '1.5',
    heading: '1.25',
  },
  space: {
    /** Standard block inset. Text blocks in the issue use 24px sides. */
    gutter: '24px',
    /** The intro region sits further in than the article region does. */
    introGutter: '48px',
    /** No inset at all — the block runs edge to edge, as the masthead does. */
    noGutter: '0px',
    tight: '3px',
    block: '12px',
    paragraph: '12px',
    section: '24px',
  },
  bigTeaser: {
    /** 33.33% of 660 − 20px inset − 2×10px frame = 180px. */
    imageWidth: 180,
    frameWidth: 10,
    /** The template's 12-column grid, split 4/8. */
    imageColumnPercent: '33.333333%',
    textColumnPercent: '66.666667%',
  },
  /** `.mceWidthContainer` — the issue is 660px wide, not the usual 600. */
  contentWidth: 660,
  /** The template stacks columns below this, and so do we. */
  mobileBreakpoint: 480,

  heading: { fontSize: '36px', color: color.brand },
  caption: {
    fontFamily: font,
    fontSize: '13px',
    lineHeight: '1.5',
    color: color.brand,
  },
  button: {
    background: color.brand,
    color: color.body,
    fontFamily: font,
    fontSize: '16px',
    padding: '16px 28px',
    radius: '4px',
  },
  divider: { width: '1px', color: color.rule, space: '0' },
  meta: { fontFamily: font, fontSize: '13px', color: color.brand },
  footer: {
    background: color.brand,
    titleSize: '32px',
    titleColor: color.page,
    color: color.page,
    textSize: '14px',
    linkColor: color.page,
    legal: {
      fontFamily: font,
      fontSize: '11px',
      color: color.page,
      linkColor: color.page,
    },
  },
};

export const eenewsKit: NewsletterKit = {
  id: 'eenews',
  theme: eenewsTheme,
  blocks: [
    'teaser',
    'rubric',
    'divider',
    'heading',
    'text',
    'image',
    'panel',
    'button',
    'meta',
    'footer',
  ],
  gutters: ['none', 'article', 'intro'],
  /**
   * The masthead region — the label row and the issue title — sits further in
   * than the article region, which is what the reproduced issue does; every
   * other block starts at the article gutter. Documents written before the
   * Einzug existed therefore render exactly as they did.
   */
  defaultGutter: {
    rubric: 'article',
    teaser: 'article',
    heading: 'intro',
    text: 'article',
    image: 'article',
    button: 'article',
    panel: 'article',
    meta: 'intro',
    divider: 'article',
    footer: 'intro',
  },
};
