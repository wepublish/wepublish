import moment, {Moment} from 'moment'
import {MetaInfo} from 'vue-meta'
import Property from '~/sdk/wep/models/properties/Property'
import WepImage from '~/sdk/wep/models/image/WepImage'
import Properties from '~/sdk/wep/models/wepPublication/page/Properties'
import Blocks, {BlockTypes} from '~/sdk/wep/models/block/Blocks'
import Block from '~/sdk/wep/models/block/Block'
import TeaserGridBlock from '~/sdk/wep/models/block/TeaserGridBlock'

export default class WepPublication {
  public id: string
  public updatedAt?: Moment
  public publishedAt?: Moment
  public slug: string
  public url: string
  public title: string
  public tags: string[]
  public properties?: Properties
  public image?: WepImage
  public socialMediaTitle: string
  public socialMediaDescription: string
  public socialMediaImage?: WepImage
  public blocks?: Blocks
  private cutBlocks: number

  constructor({
    id,
    updatedAt,
    publishedAt,
    slug,
    url,
    title,
    tags,
    properties,
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    blocks
  }: {
    id: string
    updatedAt?: Moment
    publishedAt?: Moment
    slug: string
    url: string
    title: string
    tags: string[]
    properties?: Properties
    image?: WepImage
    socialMediaTitle: string
    socialMediaDescription: string
    socialMediaImage?: WepImage
    blocks?: Blocks
  }) {
    this.id = id
    this.updatedAt = updatedAt ? moment(updatedAt) : undefined
    this.publishedAt = publishedAt ? moment(publishedAt) : undefined
    this.slug = slug
    this.url = url
    this.title = title
    this.tags = tags
    this.properties = properties
      ? new Properties().parse(properties as unknown as Property[])
      : undefined
    this.image = image ? new WepImage(image) : undefined
    this.socialMediaTitle = socialMediaTitle
    this.socialMediaDescription = socialMediaDescription
    this.socialMediaImage = socialMediaImage ? new WepImage(socialMediaImage) : undefined
    this.blocks = blocks ? new Blocks().parse(blocks as unknown as Block[]) : undefined
    this.cutBlocks = 0
  }

  public cutTopBlockType(blockType: string): BlockTypes | false {
    if (!this.blocks) {
      return false
    }
    this.cutBlocks++
    return this.blocks.cutTopBlockType(blockType, 2 - this.cutBlocks)
  }

  /**
   * How many teasers are in this page?
   */
  public countTeasers(): number {
    let teaserCount = 0
    this.blocks?.blocks.forEach(block => {
      if (block instanceof TeaserGridBlock) {
        const numTeasers = block.teasers?.teasers.length
        if (numTeasers !== undefined) {
          teaserCount += numTeasers
        }
      }
    })
    return teaserCount
  }

  public getSeoHead({
    description,
    baseUrl,
    fallBackImageUrlPath
  }: {
    description?: string
    baseUrl: string
    fallBackImageUrlPath: string
  }): MetaInfo {
    const title = this.socialMediaTitle || this?.title || ''
    const lead = this.socialMediaDescription || description || ''
    const keywords = (this.tags || []).join(', ')
    const url = `${baseUrl}/a/${this?.slug}`
    let fallbackImageUrl
    try {
      fallbackImageUrl = `${baseUrl}${fallBackImageUrlPath}`
    } catch (e) {
      console.error(e)
    }
    const imgUrl =
      this.socialMediaImage?.mdAndUpUrl || this?.image?.mdAndUpUrl || fallbackImageUrl || ''
    return {
      title,
      meta: [
        // general
        {hid: 'title', property: 'title', content: title},
        {hid: 'description', property: 'description', content: lead},
        {hid: 'keywords', property: 'keywords', content: keywords},

        // open graph
        {hid: 'og:title', property: 'og:title', content: title},
        {hid: 'og:description', property: 'og:description', content: lead},
        {hid: 'og:url', property: 'og:url', content: url},
        {hid: 'og:type', property: 'og:type', content: 'article'},
        {hid: 'og:image', property: 'og:image', content: imgUrl},
        {hid: 'og:locale', property: 'og:locale', content: 'de_CH'},

        // twitter
        {hid: 'twitter:card', name: 'twitter:card', content: 'summary'},
        {hid: 'twitter:site', name: 'twitter:site', content: '@hauptstadt_be'},
        {hid: 'twitter:title', name: 'twitter:title', content: title},
        {hid: 'twitter:description', name: 'twitter:description', content: lead},
        {hid: 'twitter:image', property: 'twitter:image', content: imgUrl}
      ]
    }
  }
}
