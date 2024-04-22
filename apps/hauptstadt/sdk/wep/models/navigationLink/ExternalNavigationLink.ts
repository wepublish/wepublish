import {gql} from 'graphql-tag'
import NavigationLink from '~/sdk/wep/models/navigationLink/NavigationLink'
import IFrontendLink from '~/sdk/wep/models/navigationLink/IFrontendLink'

export default class ExternalNavigationLink extends NavigationLink implements IFrontendLink {
  public url?: string
  constructor({label, __typename, url}: ExternalNavigationLink) {
    super({label, __typename})
    this.url = url
  }

  public getFrontendLink(): string | void {
    if (this.url?.includes('http')) {
      window.open(this.url, '_blank')
      return
    }
    if (this.url?.startsWith('/')) {
      return this.url
    } else {
      return `/${this.url}`
    }
  }

  static externalNavigationLinkFragment = gql`
    fragment externalNavigationLink on ExternalNavigationLink {
      label
      url
    }
  `
}
