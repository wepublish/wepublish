import {
  Block,
  BlockType,
  EmbedType,
  ArticleMeta,
  ImageData,
  TitleBlockValue,
  HeaderType,
  TeaserStyle,
  TeaserType
} from '../types'
import {BlockTypes} from './gqlFragments'
import {authorsAdapter, peerAdapter} from './articleAdapter'
import {ListicalItem} from '../blocks/listicalBlock'

export function getFrontBlocks(blocks: any) {
  return getBlocks(blocks)
}

export function getArticleBlocks(blocks: any, articleMeta: ArticleMeta) {
  return getBlocks(blocks, articleMeta)
}

function getBlocks(blocks: any, articleMeta?: ArticleMeta): Block[] {
  let hasTitleImage = false

  return blocks.map((block: any, index: number) => {
    switch (block.__typename) {
      case BlockTypes.RichTextBlock:
        return {
          type: BlockType.RichText,
          key: index,
          value: block.richText
        }

      case 'ImageBlock':
        if (!block.image) return null

        if (index == 0) {
          hasTitleImage = true
          return {
            type: BlockType.TitleImage,
            key: index,
            value: {
              ...block.image,
              caption: block.caption
            }
          }
        } else
          return {
            type: BlockType.Image,
            key: index,

            value: {
              ...block.image,
              caption: block.caption
            }
          }

      case 'ImageGalleryBlock':
        return {
          type: BlockType.Gallery,
          key: index,
          value: {
            title: '',
            media: block.images.map((image: any) => imageEdgeToMedia(image))
          }
        }

      case 'TeaserGridBlock':
        return {
          type: BlockType.Grid,
          key: index,
          value: {
            numColumns: block.numColumns,
            blocks: articlesToTeasers(block.teasers)
          }
        }

      case 'ListicleBlock':
        return {
          type: BlockType.Listicle,
          key: index,
          value: listicleToListical(block.items)
        }

      case 'LinkPageBreakBlock':
        return {
          type: BlockType.PeerPageBreak,
          key: index,
          value: {
            text: block.text,
            richText: block.richText,
            linkURL: block.linkURL,
            linkText: block.linkText,
            linkTarget: block.linkTarget,
            styleOption: block.styleOption,
            layoutOption: block.layoutOption,
            templateOption: block.templateOption,
            hideButton: block.hideButton,
            image: block.image && imageAdapter(block.image)
          }
        }

      case 'QuoteBlock':
        return {
          type: BlockType.Quote,
          key: index,
          value: {
            text: block.quote,
            author: block.author
          }
        }

      case 'TitleBlock':
        let value: TitleBlockValue = {
          type: HeaderType.Default,
          title: block.title,
          lead: block.lead
        }
        if (articleMeta && (index == 0 || (hasTitleImage && index == 1))) {
          value.preTitle = articleMeta.preTitle
          value.date = new Date(articleMeta.publishedAt)
          value.isHeader = true
        }
        if (articleMeta && articleMeta.isBreaking) {
          value.type = HeaderType.Breaking
          value.preTitle = articleMeta.preTitle
          value.date = new Date(articleMeta.publishedAt)
          value.isHeader = true
        }
        return {
          type: BlockType.Title,
          key: index,
          value: value
        }

      // embeds
      case 'FacebookPostBlock':
        return {
          type: BlockType.Embed,
          key: index,
          value: {
            type: EmbedType.FacebookPost,
            userID: block.userID,
            postID: block.postID
          }
        }

      case 'InstagramPostBlock':
        return {
          type: BlockType.Embed,
          key: index,
          value: {
            type: EmbedType.InstagramPost,
            postID: block.postID
          }
        }

      case 'TwitterTweetBlock':
        return {
          type: BlockType.Embed,
          key: index,
          value: {
            type: EmbedType.TwitterTweet,
            userID: block.userID,
            tweetID: block.tweetID
          }
        }

      case 'VimeoVideoBlock':
        return {
          type: BlockType.Embed,
          key: index,
          value: {
            type: EmbedType.VimeoVideo,
            videoID: block.videoID
          }
        }

      case 'YouTubeVideoBlock':
        return {
          type: BlockType.Embed,
          key: index,
          value: {
            type: EmbedType.YouTubeVideo,
            videoID: block.videoID
          }
        }

      case 'SoundCloudTrackBlock':
        return {
          type: BlockType.Embed,
          key: index,
          value: {
            type: EmbedType.SoundCloudTrack,
            trackID: block.trackID
          }
        }

      case 'EmbedBlock':
        return {
          type: BlockType.Embed,
          key: index,
          value: {
            type: EmbedType.IFrame,
            title: block.title,
            url: block.url,
            width: block.width,
            height: block.height,
            styleCustom: block.styleCustom
          }
        }

      default:
        return {}
    }
  })
}

// Other
// =====

export function imageAdapter(image: any): ImageData {
  return image
}

export function imageEdgeToMedia(imageEdge: any): ImageData {
  return {
    ...imageEdge.image,
    caption: imageEdge.caption
  }
}

export function listicleToListical(listicle: any): ListicalItem {
  return listicle.map((listItem: any) => {
    return {
      title: listItem.title,
      text: listItem.richText,
      image: listItem.image && imageAdapter(listItem.image)
    }
  })
}

export function articlesToTeasers(teasers: any): Block[] {
  return teasers.map((teaser: any) => {
    const teaserData = teaser ? teaserAdapter(teaser) : null
    return teaserData ? {type: BlockType.Teaser, key: teaserData.id, value: teaserData} : null
  })
}

export function teaserAdapter(teaser: any): ArticleMeta | null {
  const {__typename, style, image, preTitle, title, lead, peer} = teaser

  let teaserType: TeaserType
  let data: any

  switch (__typename) {
    case 'ArticleTeaser':
      teaserType = TeaserType.Article
      data = teaser.article
      break

    case 'PeerArticleTeaser':
      teaserType = TeaserType.PeerArticle
      data = teaser.article
      break

    case 'PageTeaser':
      teaserType = TeaserType.Page
      data = teaser.page
      break

    default:
      return null
  }

  if (!data) return null

  let teaserStyle: TeaserStyle

  switch (style) {
    case 'LIGHT':
      teaserStyle = TeaserStyle.Light
      break

    case 'TEXT':
      teaserStyle = TeaserStyle.Text
      break

    default:
      teaserStyle = TeaserStyle.Default
      break
  }

  if (teaserType === TeaserType.PeerArticle && !peer?.profile) return null

  return {
    id: data.id,
    url: data.url,
    publishedAt: new Date(data.publishedAt),
    updatedAt: new Date(data.updatedAt),
    peer: peer && peerAdapter(peer),
    preTitle: preTitle || data.preTitle,
    title: title || data.title,
    lead: lead || data.lead || data.description,
    image: image ? imageAdapter(image) : imageAdapter(data.image),
    slug: data.slug || undefined,
    teaserType,
    teaserStyle: data.breaking ? TeaserStyle.Breaking : teaserStyle,
    authors: data.authors && authorsAdapter(data.authors),
    socialMediaAuthors: data.socialMediaAuthors && authorsAdapter(data.socialMediaAuthors),
    tags: data.tags ?? [],
    isBreaking: data.breaking
  }
}
