import AuthorLink from '~/sdk/wep/models/author/AuthorLink'

export default class AuthorLinks {
  public links: AuthorLink[]

  constructor() {
    this.links = []
  }

  parse(links: AuthorLink[]): AuthorLinks {
    this.links = []
    for (const link of links) {
      this.links.push(new AuthorLink(link))
    }
    return this
  }
}
