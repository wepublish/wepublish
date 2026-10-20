import { FullTagFragment, FullTeaserFragment } from '@wepublish/website/api';

export const selectBkaTeaserTags = (
  teaser: FullTeaserFragment | null | undefined
): FullTagFragment[] => {
  if (!teaser) {
    return [];
  }

  switch (teaser.__typename) {
    case 'ArticleTeaser':
      return teaser.article?.tags ?? [];
    case 'PageTeaser':
      return teaser.page?.tags ?? [];
    case 'EventTeaser':
      return teaser.event?.tags ?? [];
    default:
      return [];
  }
};
