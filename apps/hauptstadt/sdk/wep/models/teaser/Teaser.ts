import WepImage from '~/sdk/wep/models/image/WepImage'
import {ReducedWepPublicationTypes} from '~/sdk/wep/models/wepPublication/ReducedWepPublication'
import ReducedArticle from '~/sdk/wep/models/wepPublication/article/ReducedArticle'

/**
 * Parent class of ArticleTeaser, PeerArticleTeaser, PageTeaser
 */
export default class Teaser {
  public style: string
  public image?: WepImage
  public preTitle?: string
  public title?: string
  public lead?: string
  public __typename: string
  public wepPublication?: ReducedWepPublicationTypes

  public static styles = {
    default: 'DEFAULT',
    text: 'TEXT',
    light: 'LIGHT'
  }

  constructor({
    style,
    image,
    preTitle,
    title,
    lead,
    wepPublication,
    __typename
  }: {
    style: string
    image?: WepImage
    preTitle?: string
    title?: string
    lead?: string
    __typename: string
    wepPublication?: ReducedWepPublicationTypes
  }) {
    this.style = style
    this.image = image ? new WepImage(image) : undefined
    this.preTitle = preTitle
    this.title = title
    this.lead = lead
    this.wepPublication = wepPublication
    this.__typename = __typename
    this.overrideTeaserProperties()
  }

  /**
   * Override teaser properties
   * @private
   */
  public overrideTeaserProperties(force = false) {
    if (!this.wepPublication) {
      return
    }
    if (!this.title || force) {
      this.title = this.wepPublication.title
    }
    if (!this.image || force) {
      this.image = this.wepPublication?.image ? new WepImage(this.wepPublication.image) : undefined
    }
    // only of type article
    if (!(this.wepPublication instanceof ReducedArticle)) {
      return
    }
    if (!this.preTitle || force) {
      this.preTitle = this.wepPublication.preTitle
    }
    if (!this.lead || force) {
      this.lead = this.wepPublication.lead
    }
  }
}
