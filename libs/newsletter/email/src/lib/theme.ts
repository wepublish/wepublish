/**
 * Design tokens for the generated newsletter.
 *
 * Every value here was read off the sent issue "Die Unterschätzten –
 * ee-news.ch Newsletter 13.8.26" (Mailchimp campaign 6e2162b16f), not invented.
 * That issue is the layout this renderer reproduces.
 *
 * This is the only place a colour, font or measurement may be written down.
 * A value inlined in a block is a value nobody will find again when the design
 * changes — which is the whole reason the design moved out of Mailchimp.
 */
export const theme = {
  font: {
    /** The template's house font; the fallback is what most clients actually use. */
    body: '"DM Sans", Helvetica, Arial, sans-serif',
  },
  color: {
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
  },
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
} as const;
