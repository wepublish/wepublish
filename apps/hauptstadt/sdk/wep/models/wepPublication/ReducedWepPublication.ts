/**
 * Super class of ReducedArticle and ReducedPage to avoid circular dependencies.
 */
import moment, {Moment} from 'moment'
import WepImage from '~/sdk/wep/models/image/WepImage'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'
import ReducedPage from '~/sdk/wep/models/wepPublication/page/ReducedPage'
import Properties from '~/sdk/wep/models/wepPublication/page/Properties'
import Property from '~/sdk/wep/models/properties/Property'

export type ReducedWepPublicationTypes = ReducedArticle | ReducedPage

export default class ReducedWepPublication {
  public id: string
  public publishedAt?: Moment
  public slug: string
  public url: string
  public title: string
  public preTitle?: string
  public image?: WepImage
  public properties?: Properties

  constructor({
    id,
    publishedAt,
    slug,
    url,
    title,
    preTitle,
    image,
    properties
  }: {
    id: string
    publishedAt?: Moment
    slug: string
    url: string
    title: string
    preTitle?: string
    image?: WepImage
    properties?: Properties
  }) {
    this.id = id
    this.publishedAt = publishedAt ? moment(publishedAt) : undefined
    this.slug = slug
    this.url = url
    this.title = title
    this.preTitle = preTitle
    this.image = image ? new WepImage(image) : undefined
    this.properties = properties
      ? new Properties().parse(properties as unknown as Property[])
      : undefined
  }
}
