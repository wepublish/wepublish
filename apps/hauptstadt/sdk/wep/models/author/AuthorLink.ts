export default class AuthorLink {
  public title: string
  public url: string

  constructor({title, url}: AuthorLink) {
    this.title = title
    this.url = url
  }
}
