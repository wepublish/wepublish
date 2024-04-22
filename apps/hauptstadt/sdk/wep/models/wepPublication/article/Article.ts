import {gql} from 'graphql-tag'
import {Moment} from 'moment'
import WepPublication from '~/sdk/wep/models/wepPublication/WepPublication'
import Property from '~/sdk/wep/models/properties/Property'
import WepImage from '~/sdk/wep/models/image/WepImage'
import Authors from '~/sdk/wep/models/author/Authors'
import Author from '~/sdk/wep/models/author/Author'
import TeaserGridBlock from '~/sdk/wep/models/block/TeaserGridBlock'
import QuoteBlock from '~/sdk/wep/models/block/QuoteBlock'
import EmbedBlock from '~/sdk/wep/models/block/EmbedBlock'
import ListicleBlock from '~/sdk/wep/models/block/ListicleBlock'
import ImageGalleryBlock from '~/sdk/wep/models/block/ImageGalleryBlock'
import RichTextBlock from '~/sdk/wep/models/block/RichTextBlock'
import ImageBlock from '~/sdk/wep/models/block/ImageBlock'
import TitleBlock from '~/sdk/wep/models/block/TitleBlock'
import TwitterTweetBlock from '~/sdk/wep/models/block/TwitterTweetBlock'
import InstagramPostBlock from '~/sdk/wep/models/block/InstagramPostBlock'
import LinkPageBreakBlock from '~/sdk/wep/models/block/LinkPageBreakBlock'
import Properties from '~/sdk/wep/models/wepPublication/page/Properties'
import Blocks from '~/sdk/wep/models/block/Blocks'
import Comments from '~/sdk/wep/models/comment/Comments'
import Comment from '~/sdk/wep/models/comment/Comment'
import YouTubeVideoBlock from '~/sdk/wep/models/block/YouTubeVideoBlock'
import PollBlock from '~/sdk/wep/models/block/PollBlock'
import HTMLBlock from '~/sdk/wep/models/block/HTMLBlock'

export default class Article extends WepPublication {
  public preTitle?: string
  public lead: string
  public authors?: Authors
  public comments?: Comments

  constructor({
    id,
    updatedAt,
    publishedAt,
    slug,
    url,
    title,
    preTitle,
    lead,
    tags,
    properties,
    image,
    authors,
    socialMediaTitle,
    socialMediaDescription,
    socialMediaImage,
    blocks,
    comments
  }: {
    id: string
    updatedAt?: Moment
    publishedAt?: Moment
    slug: string
    url: string
    title: string
    preTitle?: string
    lead: string
    tags: string[]
    properties?: Properties
    image?: WepImage
    authors?: Authors
    socialMediaTitle: string
    socialMediaDescription: string
    socialMediaImage?: WepImage
    blocks?: Blocks
    comments?: Comments
  }) {
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
    this.preTitle = preTitle
    this.lead = lead
    this.authors = authors ? new Authors().parse(authors as unknown as Author[]) : undefined
    this.comments = comments ? new Comments().parse(comments as unknown as Comment[]) : undefined
  }

  /**
   * GRAPHQL FRAGMENTS
   */
  public static articleFragment = gql`
    fragment article on Article {
      id
      updatedAt
      publishedAt
      slug
      url
      preTitle
      title
      lead
      seoTitle
      tags
      canonicalUrl
      properties {
        ...property
      }
      image {
        ...image
      }
      authors {
        ...authors
      }
      breaking
      socialMediaTitle
      socialMediaDescription
      socialMediaAuthors {
        ...authors
      }
      socialMediaImage {
        ...image
      }
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
        ... on PollBlock {
          ...pollBlock
        }
        ... on HTMLBlock {
          ...htmlBlock
        }
      }
      comments {
        ...comment
      }
    }
    ${Property.propertyFragment}
    ${WepImage.wepImageFragment}
    ${Authors.authorsFragment}
    ${TeaserGridBlock.teaserGridBlockFragment}
    ${QuoteBlock.quoteBlockFragment}
    ${EmbedBlock.embedBlockFragment}
    ${ListicleBlock.listicleBlockFragment}
    ${ImageGalleryBlock.imageGalleryBlockFragment}
    ${RichTextBlock.richTextBlockFragment}
    ${ImageBlock.imageBlockFragment}
    ${TitleBlock.titleBlockFragment}
    ${TwitterTweetBlock.twitterTweetBlockFragment}
    ${InstagramPostBlock.instagramPostBlockFragment}
    ${LinkPageBreakBlock.linkPageBreakBlockFragment}
    ${Comment.commentFragment}
    ${YouTubeVideoBlock.youTubeVideoBlockFragment}
    ${PollBlock.pollBlockFragment}
    ${HTMLBlock.htmlBlockFragment}
  `

  /**
   * Does not load properties nor teaserGridBlock
   */
  public static peerArticleFragment = gql`
    fragment article on Article {
      id
      updatedAt
      publishedAt
      slug
      url
      preTitle
      title
      lead
      seoTitle
      tags
      canonicalUrl
      image {
        ...image
      }
      authors {
        ...authors
      }
      breaking
      socialMediaTitle
      socialMediaDescription
      socialMediaAuthors {
        ...authors
      }
      socialMediaImage {
        ...image
      }
      blocks {
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
      }
    }
    ${WepImage.wepImageFragment}
    ${Authors.authorsFragment}
    ${QuoteBlock.quoteBlockFragment}
    ${EmbedBlock.embedBlockFragment}
    ${ListicleBlock.listicleBlockFragment}
    ${ImageGalleryBlock.imageGalleryBlockFragment}
    ${RichTextBlock.richTextBlockFragment}
    ${ImageBlock.imageBlockFragment}
    ${TitleBlock.titleBlockFragment}
    ${TwitterTweetBlock.twitterTweetBlockFragment}
    ${InstagramPostBlock.instagramPostBlockFragment}
    ${LinkPageBreakBlock.linkPageBreakBlockFragment}
    ${YouTubeVideoBlock.youTubeVideoBlockFragment}
  `
}
