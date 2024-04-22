import IFrontendLink from '~/sdk/wep/models/navigationLink/IFrontendLink'

export default class NavigationLink implements IFrontendLink {
  public label: string
  public __typename: string

  constructor({label, __typename}: {label: string; __typename: string}) {
    this.label = label
    this.__typename = __typename
  }

  public getFrontendLink(): string | void {
    return ''
  }
}
