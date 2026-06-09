import type { FullTeaserFragment } from '@wepublish/website/api';

export type EeNewsTag = { id: string; tag: string; color?: string | null };

type RawTag = { id: string; tag?: string | null; color?: string | null };

const toEeNewsTag = (tag: RawTag | undefined): EeNewsTag | undefined => {
  if (!tag?.tag) {
    return undefined;
  }
  return { id: tag.id, tag: tag.tag, color: tag.color ?? undefined };
};

const FRENCH_ARTICLES_TAGS = ['article en français', 'articles en français'];

export const ALLOWED_TAG_NAMES = [
  'articles en français',
  'aeesuisse',
  'the smarter e',
  'energiestrategie 2050',
  'bauen',
  'bücher',
  'batterien',
  'akw-debatte',
  'mobilität',
  'fossile energien',
  'klima',
];

const ALLOWED_TAGS = new Set(ALLOWED_TAG_NAMES);

export const isAllowedTagName = (name: string | null | undefined): boolean =>
  ALLOWED_TAGS.has(name?.toLowerCase().trim() ?? '');

export const resolveWhitelistTagIds = (
  nodes: ReadonlyArray<{ id: string; tag?: string | null }>
): string[] =>
  nodes.filter(node => isAllowedTagName(node.tag)).map(node => node.id);

const isFrenchArticlesTag = (tag: { tag?: string | null }): boolean =>
  FRENCH_ARTICLES_TAGS.includes(tag.tag?.toLowerCase().trim() ?? '');

export const selectTeaserTag = (
  teaser: FullTeaserFragment | null | undefined,
  priorityTagName?: string
): EeNewsTag | undefined => {
  if (teaser?.__typename !== 'ArticleTeaser') {
    return undefined;
  }
  const tags = teaser.article?.tags ?? [];
  const french = tags.find(isFrenchArticlesTag);
  if (french) {
    return toEeNewsTag(french);
  }
  if (priorityTagName) {
    const priority = tags.find(
      t => t.tag?.toLowerCase().trim() === priorityTagName.toLowerCase().trim()
    );
    if (priority) {
      return toEeNewsTag(priority);
    }
  }
  return toEeNewsTag(tags.find(t => isAllowedTagName(t.tag)));
};

export const selectTeaserTopic = (
  teaser: FullTeaserFragment | null | undefined
): EeNewsTag | undefined => {
  if (teaser?.__typename !== 'ArticleTeaser') {
    return undefined;
  }
  return toEeNewsTag(teaser.article?.tags?.find(t => t.main));
};

export const selectTeaserBreaking = (
  teaser: FullTeaserFragment | null | undefined
): boolean => {
  if (teaser?.__typename !== 'ArticleTeaser') {
    return false;
  }
  return teaser.article?.latest?.breaking ?? false;
};
