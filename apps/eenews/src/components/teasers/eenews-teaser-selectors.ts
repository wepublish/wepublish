import type { Teaser } from '@wepublish/website/api';

export type EeNewsTag = { id: string; tag: string; color?: string | null };

type RawTag = { id: string; tag?: string | null; color?: string | null };

const toEeNewsTag = (tag: RawTag | undefined): EeNewsTag | undefined => {
  if (!tag?.tag) {
    return undefined;
  }
  return { id: tag.id, tag: tag.tag, color: tag.color ?? undefined };
};

const FRENCH_ARTICLES_TAGS = ['article en français', 'articles en français'];

const ALLOWED_TAGS = new Set([
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
]);

export const isAllowedTagName = (name: string | null | undefined): boolean =>
  ALLOWED_TAGS.has(name?.toLowerCase().trim() ?? '');

const isFrenchArticlesTag = (tag: { tag?: string | null }): boolean =>
  FRENCH_ARTICLES_TAGS.includes(tag.tag?.toLowerCase().trim() ?? '');

export const selectTeaserTag = (
  teaser: Teaser | null | undefined,
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
  teaser: Teaser | null | undefined
): EeNewsTag | undefined => {
  if (teaser?.__typename !== 'ArticleTeaser') {
    return undefined;
  }
  return toEeNewsTag(teaser.article?.tags?.find(t => t.main));
};

export const selectTeaserBreaking = (
  teaser: Teaser | null | undefined
): boolean => {
  if (teaser?.__typename !== 'ArticleTeaser') {
    return false;
  }
  return (
    teaser.article?.latest?.properties?.find(p => p.key === 'breaking')
      ?.value === 'true'
  );
};

export const selectTeaserReadTime = (
  teaser: Teaser | null | undefined
): number | undefined => {
  if (teaser?.__typename !== 'ArticleTeaser') {
    return undefined;
  }
  const raw = teaser.article?.latest?.properties?.find(
    p => p.key === 'readTimeMin'
  )?.value;
  if (!raw) {
    return undefined;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
};
