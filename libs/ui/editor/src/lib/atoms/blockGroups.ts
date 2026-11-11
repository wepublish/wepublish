export const BLOCK_GROUPS = [
  'text',
  'media',
  'teasers',
  'interaction',
  'layout',
] as const;

export type BlockGroup = (typeof BLOCK_GROUPS)[number];
