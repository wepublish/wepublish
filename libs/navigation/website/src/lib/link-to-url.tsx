import { FullNavigationFragment } from '@wepublish/website/api';

export const navigationLinkToUrl = <T extends FullNavigationFragment>(
  link: T['links'][number]
): string | undefined => {
  switch (link.__typename) {
    case 'ArticleNavigationLink':
      return link.article?.url;
    case 'PageNavigationLink':
      return link.page?.url;
    case 'ExternalNavigationLink':
      return link.url ?? undefined;
  }
};
