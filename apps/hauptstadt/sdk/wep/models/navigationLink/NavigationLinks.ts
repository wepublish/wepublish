import ExternalNavigationLink from '~/sdk/wep/models/navigationLink/ExternalNavigationLink'
import PageNavigationLink from '~/sdk/wep/models/navigationLink/PageNavigationLink'
import ArticleNavigationLink from '~/sdk/wep/models/navigationLink/ArticleNavigationLink'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'

export default class NavigationLinks {
  public links: (ExternalNavigationLink | PageNavigationLink | ArticleNavigationLink)[]

  constructor() {
    this.links = []
  }

  parse<T extends NavigationLink>(links: T[]): NavigationLinks {
    this.links = []
    for (const link of links) {
      switch (link.__typename) {
        case 'ExternalNavigationLink':
          this.links.push(new ExternalNavigationLink(link as ExternalNavigationLink))
          break
        case 'PageNavigationLink':
          this.links.push(new PageNavigationLink(link as PageNavigationLink))
          break
        case 'ArticleNavigationLink':
          this.links.push(new ArticleNavigationLink(link as ArticleNavigationLink))
          break
      }
    }
    return this
  }
}
