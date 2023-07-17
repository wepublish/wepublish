import {NavigationQuery} from '@wepublish/website/api'

export const navigationLinkToUrl = <T extends NonNullable<NavigationQuery['navigation']>>(
  link: T['links'][number]
): string | undefined => {
  switch (link.__typename) {
    case 'ArticleNavigationLink':
      return link.article?.url
    case 'PageNavigationLink':
      return link.page?.url
    case 'ExternalNavigationLink':
      return link.url
  }
}
