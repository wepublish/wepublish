import {gql} from 'graphql-tag'
import WepPublication from '~/sdk/wep/models/wepPublication/WepPublication'
import WepImage from '~/sdk/wep/models/image/WepImage'
import Property from '~/sdk/wep/models/properties/Property'
import TeaserGridBlock from '~/sdk/wep/models/block/TeaserGridBlock'
import RichTextBlock from '~/sdk/wep/models/block/RichTextBlock'
import ImageBlock from '~/sdk/wep/models/block/ImageBlock'
import TitleBlock from '~/sdk/wep/models/block/TitleBlock'
import ImageGalleryBlock from '~/sdk/wep/models/block/ImageGalleryBlock'
import ListicleBlock from '~/sdk/wep/models/block/ListicleBlock'
import QuoteBlock from '~/sdk/wep/models/block/QuoteBlock'
import EmbedBlock from '~/sdk/wep/models/block/EmbedBlock'
import TwitterTweetBlock from '~/sdk/wep/models/block/TwitterTweetBlock'
import InstagramPostBlock from '~/sdk/wep/models/block/InstagramPostBlock'
import LinkPageBreakBlock from '~/sdk/wep/models/block/LinkPageBreakBlock'
import Teasers from '~/sdk/wep/models/teaser/Teasers'
import Articles from '~/sdk/wep/models/wepPublication/article/Articles'
import YouTubeVideoBlock from '~/sdk/wep/models/block/YouTubeVideoBlock'
import HTMLBlock from '~/sdk/wep/models/block/HTMLBlock'
import Block from '../../block/Block'

export default class Page extends WepPublication {
  public description: string
  constructor({
    id,
    updatedAt,
    publishedAt,
    slug,
    url,
    title,
    description,
    tags,
    properties,
    image,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    blocks
  }: Page) {
    super({
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
    })
    this.description = description
  }

  /**
   * Display an error message on the page instead of the page content
   * @param title The title of the message to display in larger type
   * @param message The content of the message itself
   * @returns void
   */
  public showErrorMessage(title: string, message: string) {
    if (!this.blocks) {
      return
    }
    this.blocks.blocks = [
      new TitleBlock({
        __typename: 'TitleBlock',
        title: title,
        lead: message
      })
    ]
  }

  /**
   * Pass a bunch of articles which will overwrite the one on this page
   * @param articles
   */
  public replaceContainingArticles(articles: Articles | false) {
    // some checks at the beginning
    const blocks = this.blocks?.blocks
    if (!blocks) {
      return
    }
    if (!articles || !articles.articles) {
      return
    }

    for (const block of blocks) {
      // only replace articles in teaser grid blocks
      if (!(block instanceof TeaserGridBlock)) {
        continue
      }
      // iterate all teasers of the current block
      const teasers: Teasers | undefined = block.teasers
      if (!teasers) {
        return
      }
      const deleteUnusedTeaserIds: number[] = []
      let teaserIndex = 0
      for (const teaser of teasers.teasers) {
        teaserIndex++
        const article = articles.articles.shift()
        // if no article available anymore or it's a dummy, delete
        if (!article || article.slug === 'dummy') {
          deleteUnusedTeaserIds.push(teaserIndex - 1)
          continue
        }
        // replace publication in the teaser
        teaser.wepPublication = undefined
        teaser.wepPublication = article
        teaser.overrideTeaserProperties(true)
      }

      // delete unused teasers to not be showed
      for (let i = deleteUnusedTeaserIds.length; i > 0; i--) {
        teasers.teasers.splice(deleteUnusedTeaserIds[i - 1], 1)
      }
    }
  }

  /**
   *  GRAPHQL FRAGMENTS
   */

  static pageFragment = gql`
    fragment page on Page {
      id
      updatedAt
      publishedAt
      slug
      url
      title
      tags
      properties {
        ...property
      }
      image {
        ...image
      }
      socialMediaTitle
      socialMediaDescription
      socialMediaImage {
        ...image
      }
      description
      blocks {
        ... on TeaserGridBlock {
          ...teaserGridBlock
        }
        ... on RichTextBlock {
          ...richTextBlock
        }
        ... on ImageBlock {
          ...imageBlock
        }
        ... on TitleBlock {
          ...titleBlock
        }
        ... on ImageGalleryBlock {
          ...imageGalleryBlock
        }
        ... on ListicleBlock {
          ...listicleBlock
        }
        ... on QuoteBlock {
          ...quoteBlock
        }
        ... on EmbedBlock {
          ...embedBlock
        }
        ... on TwitterTweetBlock {
          ...twitterTweetBlock
        }
        ... on InstagramPostBlock {
          ...instagramPostBlock
        }
        ... on LinkPageBreakBlock {
          ...linkPageBreakBlock
        }
        ... on YouTubeVideoBlock {
          ...youTubeVideoBlock
        }
        ... on HTMLBlock {
          ...htmlBlock
        }
      }
    }
    ${Property.propertyFragment}
    ${WepImage.wepImageFragment}
    ${TeaserGridBlock.teaserGridBlockFragment}
    ${RichTextBlock.richTextBlockFragment}
    ${ImageBlock.imageBlockFragment}
    ${TitleBlock.titleBlockFragment}
    ${ImageGalleryBlock.imageGalleryBlockFragment}
    ${ListicleBlock.listicleBlockFragment}
    ${QuoteBlock.quoteBlockFragment}
    ${EmbedBlock.embedBlockFragment}
    ${TwitterTweetBlock.twitterTweetBlockFragment}
    ${InstagramPostBlock.instagramPostBlockFragment}
    ${LinkPageBreakBlock.linkPageBreakBlockFragment}
    ${YouTubeVideoBlock.youTubeVideoBlockFragment}
    ${HTMLBlock.htmlBlockFragment}
  `
}
