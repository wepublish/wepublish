import {gql} from 'graphql-tag'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'
import Page from '~/sdk/wep/models/wepPublication/page/Page'
import ReducedPage from '~/sdk/wep/models/wepPublication/page/ReducedPage'
import IFrontendLink from '~/sdk/wep/models/navigationLink/IFrontendLink'

export default class PageNavigationLink extends NavigationLink implements IFrontendLink {
  public page?: Page
  constructor({label, __typename, page}: {label: string; __typename: string; page?: Page}) {
    super({label, __typename})
    this.page = page
  }

  public getFrontendLink(): string {
    return `/p/${this.page?.slug}`
  }

  /**
   *  GRAPHQL FRAGMENTS
   */
  static pageNavigationLinkFragment = gql`
    fragment pageNavigationLink on PageNavigationLink {
      label
      page {
        ...reducedPage
      }
    }
    ${ReducedPage.reducedPageFragment}
  `
}
