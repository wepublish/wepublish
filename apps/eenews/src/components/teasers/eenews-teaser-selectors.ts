import type { Teaser } from '@wepublish/website/api';

export type EeNewsTag = { id: string; tag: string; color?: string | null };

export const selectTeaserTag = (
  teaser: Teaser | null | undefined
): EeNewsTag | undefined => {
  if (teaser?.__typename !== 'ArticleTeaser') {
    return undefined;
  }
  const tag = teaser.article?.tags?.[0];
  if (!tag?.tag) {
    return undefined;
  }
  return { id: tag.id, tag: tag.tag, color: tag.color ?? undefined };
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
