import {gql} from 'graphql-tag'
import ExternalNavigationLink from '~/sdk/wep/models/navigationLink/ExternalNavigationLink'
import PageNavigationLink from '~/sdk/wep/models/navigationLink/PageNavigationLink'
import ArticleNavigationLink from '~/sdk/wep/models/navigationLink/ArticleNavigationLink'
import NavigationLinks from '~/sdk/wep/models/navigationLink/NavigationLinks'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'

export default class Navigation {
  public id: number
  public key: string
  public name: string
  public links?: NavigationLinks

  constructor({id, key, name, links}: Navigation) {
    this.id = id
    this.key = key
    this.name = name
    this.links = links
      ? new NavigationLinks().parse(links as unknown as NavigationLink[])
      : undefined
  }

  /**
   *  GRAPHQL FRAGMENTS
   */
  static navigationFragment = gql`
    fragment navigation on Navigation {
      id
      key
      name
      links {
        ... on ExternalNavigationLink {
          ...externalNavigationLink
        }
        ... on PageNavigationLink {
          ...pageNavigationLink
        }
        ... on ArticleNavigationLink {
          ...articleNavigationLink
        }
      }
    }
    ${ExternalNavigationLink.externalNavigationLinkFragment}
    ${PageNavigationLink.pageNavigationLinkFragment}
    ${ArticleNavigationLink.articleNavigationFragment}
  `
}
