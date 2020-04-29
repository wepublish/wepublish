import {
  Block,
  BlockType,
  EmbedType,
  ArticleMeta,
  ImageData,
  TitleBlockValue,
  HeaderType
} from '../types'
import {BlockTypes} from './gqlFragments'
import {authorsAdapter} from './articleAdapter'
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

      case 'ArticleTeaserGridBlock':
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
          value: listicleToListical(block.listicle)
        }

      case 'LinkPageBreakBlock':
        return {
          type: BlockType.PeerPageBreak,
          key: index,
          value: {
            text: block.text,
            linkURL: block.linkURL,
            linkText: block.linkText
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
            height: block.height
          }
        }

      default:
        return {}
    }
  })
}

export function imageAdapter(image: any): ImageData {
  return image
}

export function imageEdgeToMedia(imageEdge: any): ImageData {
  return {
    ...imageEdge.node,
    caption: imageEdge.description
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
    return teaser && teaser?.article
      ? {
          type: BlockType.Teaser,
          key: teaser.article.id,
          value: teaserAdapter(teaser)
        }
      : null
  })
}

export function teaserAdapter(teaser: any): ArticleMeta | null {
  const published = teaser.article
  let {overrides, article} = teaser

  overrides = overrides || {} // TODO: Upgrade to TypeScript 3.7 and use optional chaining

  return {
    id: article.id,
    publishedAt: new Date(teaser.article.publishedAt),
    updatedAt: new Date(teaser.article.updatedAt),
    peer: article.peer,
    preTitle: overrides.preTitle ? overrides.preTitle : published.preTitle,
    title: overrides.title ? overrides.title : published.title,
    lead: overrides.lead ? overrides.lead : published.lead,
    image: overrides.image ? imageAdapter(overrides.image) : imageAdapter(published.image),
    slug: published.slug || undefined,
    teaserType: teaser.type,
    authors: published.authors && authorsAdapter(published.authors),
    tags: published.tags,
    isBreaking: published.breaking
  }
}
