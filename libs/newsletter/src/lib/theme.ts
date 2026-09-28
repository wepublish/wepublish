/**
 * Design tokens of the generated newsletter. Every value was read off a sent
 * ee-news.ch issue; this is the only place a colour, font or measurement may
 * be written down.
 */
export const theme = {
  font: {
    body: '"DM Sans", Helvetica, Arial, sans-serif',
  },
  color: {
    page: '#f8f5ee',
    body: '#ffffff',
    text: '#000000',
    brand: '#195a7d',
    tint: '#f0faff',
    highlight: '#f8fff5',
    link: '#252525',
    rule: '#d0d0d0',
  },
  size: {
    body: '15px',
    heading: '20px',
  },
  lineHeight: {
    body: '1.5',
    heading: '1.25',
  },
  space: {
    gutter: '24px',
    introGutter: '48px',
    noGutter: '0px',
    tight: '3px',
    block: '12px',
    section: '24px',
  },
  bigTeaser: {
    imageWidth: 180,
    frameWidth: 10,
    imageColumnPercent: '33.333333%',
    textColumnPercent: '66.666667%',
  },
  contentWidth: 660,
  mobileBreakpoint: 480,
} as const;

/**
 * Images are requested at twice the column they render in so they stay sharp
 * on high-density screens; Word scales them down cleanly.
 */
export const IMAGE_DENSITY = 2;
