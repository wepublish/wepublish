import { slugify } from '@wepublish/utils';

export const anchorId = (text: unknown): string | undefined =>
  typeof text === 'string' && text.length > 0 ? slugify(text) : undefined;
