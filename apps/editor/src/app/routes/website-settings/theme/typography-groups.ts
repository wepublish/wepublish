import type { z } from 'zod';

import type { typographySchema } from './schema';

export type TypographyVariant = Exclude<
  keyof z.infer<typeof typographySchema>,
  'allVariants'
>;

export type TypographyGroup = {
  key: 'headings' | 'text' | 'teasers' | 'article' | 'banner' | 'blocks';
  variants: readonly TypographyVariant[];
};

export const typographyGroups: readonly TypographyGroup[] = [
  { key: 'headings', variants: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
  { key: 'text', variants: ['body1', 'body2', 'caption'] },
  {
    key: 'teasers',
    variants: ['teaserPretitle', 'teaserTitle', 'teaserLead', 'teaserMeta'],
  },
  { key: 'article', variants: ['articleAuthors', 'peerInformation'] },
  { key: 'banner', variants: ['bannerTitle', 'bannerText', 'bannerCta'] },
  {
    key: 'blocks',
    variants: [
      'blockBreakTitle',
      'blockBreakBody',
      'blockTitlePreTitle',
      'blockQuote',
    ],
  },
];
