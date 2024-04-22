import Navigation from '~/sdk/wep/models/navigation/Navigation'

export default class Navigations {
  public navigations: Navigation[]
  constructor() {
    this.navigations = []
  }

  getNavigationByKey(key: string) {
    return this.navigations.find((navigation: Navigation) => navigation.key === key)
  }
}
