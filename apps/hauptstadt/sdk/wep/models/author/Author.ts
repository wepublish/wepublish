import {Moment} from 'moment'
import AuthorLinks from '~/sdk/wep/models/author/AuthorLinks'
import WepImage from '~/sdk/wep/models/image/WepImage'
import AuthorLink from '~/sdk/wep/models/author/AuthorLink'

export default class Author {
  public id: string
  public createdAt: Moment
  public modifiedAt: Moment
  public name: string
  public slug: string
  public url: string
  public links?: AuthorLinks
  public bio: string
  public jobTitle: string
  public image?: WepImage

  constructor({id, createdAt, modifiedAt, name, slug, url, links, bio, jobTitle, image}: Author) {
    this.id = id
    this.createdAt = createdAt
    this.modifiedAt = modifiedAt
    this.name = name
    this.slug = slug
    this.url = url
    this.links = links ? new AuthorLinks().parse(links as unknown as AuthorLink[]) : undefined
    this.bio = bio
    this.jobTitle = jobTitle
    this.image = image ? new WepImage(image) : undefined
  }
}
