import {BlockListValue} from '@karma.run/ui'
import {Node, Range} from 'slate'

import nanoid from 'nanoid'

import {ImageRefData} from './image'
import {ArticleReference} from './article'

export enum BlockType {
  RichText = 'richText',
  Title = 'title',
  Image = 'image',
  Quote = 'quote',
  FacebookPost = 'facebookPost',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  Embed = 'embed',
  LinkPageBreak = 'linkPageBreak',
  ArticleTeaserGrid1 = 'articleTeaserGrid1',
  ArticleTeaserGrid6 = 'articleTeaserGrid6'
}

export interface RichTextBlockValue {
  readonly value: Node[]
  readonly selection: Range | null
}

export interface ImageBlockValue {
  readonly image: ImageRefData | null
  readonly caption: string
}

export interface TitleBlockValue {
  readonly title: string
  readonly lead: string
}

export interface QuoteBlockValue {
  readonly quote: string
  readonly author: string
}

export interface LinkPageBreakBlockValue {
  readonly text: string
  readonly linkURL: string
  readonly linkText: string
}

export enum EmbedType {
  FacebookPost = 'facebookPost',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  Other = 'other'
}

export interface FacebookPostEmbed {
  readonly type: EmbedType.FacebookPost
  readonly userID: string
  readonly postID: string
}

export interface InstagramPostEmbed {
  readonly type: EmbedType.InstagramPost
  readonly postID: string
}

export interface TwitterTweetEmbed {
  readonly type: EmbedType.TwitterTweet
  readonly userID: string
  readonly tweetID: string
}

export interface VimeoVideoEmbed {
  readonly type: EmbedType.VimeoVideo
  readonly videoID: string
}

export interface YouTubeVideoEmbed {
  readonly type: EmbedType.YouTubeVideo
  readonly videoID: string
}

export interface SoundCloudTrackEmbed {
  readonly type: EmbedType.SoundCloudTrack
  readonly trackID: string
}

export interface OtherEmbed {
  readonly type: EmbedType.Other
  readonly url?: string
  readonly title?: string
  readonly width?: number
  readonly height?: number
}

export type EmbedBlockValue =
  | FacebookPostEmbed
  | InstagramPostEmbed
  | TwitterTweetEmbed
  | VimeoVideoEmbed
  | YouTubeVideoEmbed
  | SoundCloudTrackEmbed
  | OtherEmbed

export interface ArticleTeaser {
  readonly type: string
  readonly article?: ArticleReference
}

export interface TeaserGridBlockValue {
  readonly teasers: Array<[string, ArticleTeaser | null]>
  readonly numColumns: number
}

export type RichTextBlockListValue = BlockListValue<BlockType.RichText, RichTextBlockValue>
export type ImageBlockListValue = BlockListValue<BlockType.Image, ImageBlockValue>
export type TitleBlockListValue = BlockListValue<BlockType.Title, TitleBlockValue>
export type QuoteBlockListValue = BlockListValue<BlockType.Quote, QuoteBlockValue>
export type EmbedBlockListValue = BlockListValue<BlockType.Embed, EmbedBlockValue>
export type LinkPageBreakBlockListValue = BlockListValue<
  BlockType.LinkPageBreak,
  LinkPageBreakBlockValue
>

export type ArticleTeaserGridBlock1ListValue = BlockListValue<
  BlockType.ArticleTeaserGrid1,
  TeaserGridBlockValue
>

export type ArticleTeaserGridBlock6ListValue = BlockListValue<
  BlockType.ArticleTeaserGrid6,
  TeaserGridBlockValue
>

export type BlockValue =
  | TitleBlockListValue
  | RichTextBlockListValue
  | ImageBlockListValue
  | QuoteBlockListValue
  | EmbedBlockListValue
  | LinkPageBreakBlockListValue
  | ArticleTeaserGridBlock1ListValue
  | ArticleTeaserGridBlock6ListValue

export interface BlockUnionMap {
  readonly image?: {
    readonly caption?: string
    readonly imageID?: string
  }

  readonly title?: {
    readonly title?: string
    readonly lead?: string
  }

  readonly richText?: {
    readonly richText: Node[]
  }

  readonly quote?: {
    readonly quote?: string
    readonly author?: string
  }

  readonly facebookPost?: {
    readonly userID: string
    readonly postID: string
  }

  readonly instagramPost?: {
    readonly postID: string
  }

  readonly twitterTweet?: {
    readonly userID: string
    readonly tweetID: string
  }

  readonly vimeoVideo?: {
    readonly videoID: string
  }

  readonly youTubeVideo?: {
    readonly videoID: string
  }

  readonly soundCloudTrack?: {
    readonly trackID: string
  }

  readonly embed?: {
    readonly url?: string
    readonly title?: string
    readonly width?: number
    readonly height?: number
  }

  readonly linkPageBreak?: {
    readonly text?: string
    readonly linkURL?: string
    readonly linkText?: string
  }

  readonly articleTeaserGrid?: {
    readonly teasers: Array<{type: string; articleID: string} | null>
    readonly numColumns: number
  }
}

export function unionMapForBlock(block: BlockValue): BlockUnionMap {
  switch (block.type) {
    case BlockType.Image:
      return {
        image: {
          imageID: block.value.image?.id,
          caption: block.value.caption || undefined
        }
      }

    case BlockType.Title:
      return {
        title: {
          title: block.value.title || undefined,
          lead: block.value.lead || undefined
        }
      }

    case BlockType.RichText:
      return {
        richText: {richText: block.value.value}
      }

    case BlockType.Quote:
      return {
        quote: {
          quote: block.value.quote || undefined,
          author: block.value.author || undefined
        }
      }

    case BlockType.LinkPageBreak:
      return {
        linkPageBreak: {
          text: block.value.text || undefined,
          linkText: block.value.linkText || undefined,
          linkURL: block.value.linkURL || undefined
        }
      }

    case BlockType.Embed: {
      const {value} = block

      switch (value.type) {
        case EmbedType.FacebookPost:
          return {
            facebookPost: {
              userID: value.userID,
              postID: value.postID
            }
          }

        case EmbedType.InstagramPost:
          return {
            instagramPost: {
              postID: value.postID
            }
          }

        case EmbedType.TwitterTweet:
          return {
            twitterTweet: {
              userID: value.userID,
              tweetID: value.tweetID
            }
          }

        case EmbedType.VimeoVideo:
          return {
            vimeoVideo: {
              videoID: value.videoID
            }
          }

        case EmbedType.YouTubeVideo:
          return {
            youTubeVideo: {
              videoID: value.videoID
            }
          }

        case EmbedType.SoundCloudTrack:
          return {
            soundCloudTrack: {
              trackID: value.trackID
            }
          }

        case EmbedType.Other:
          return {
            embed: {
              title: value.title,
              url: value.url,
              width: value.width,
              height: value.height
            }
          }
      }
    }

    case BlockType.ArticleTeaserGrid1:
    case BlockType.ArticleTeaserGrid6:
      return {
        articleTeaserGrid: {
          teasers: block.value.teasers.map(([, value]) =>
            value && value.article ? {type: value.type, articleID: value.article.id} : null
          ),
          numColumns: block.value.numColumns
        }
      }
  }
}

export function blockForQueryBlock(block: any): BlockValue | null {
  const type: string = block.__typename
  const key: string = nanoid()

  switch (type) {
    case 'ImageBlock':
      return {
        key,
        type: BlockType.Image,
        value: {
          caption: block.caption ?? '',
          image: block.image ? block.image : null
        }
      }

    case 'TitleBlock':
      return {
        key,
        type: BlockType.Title,
        value: {
          title: block.title ?? '',
          lead: block.lead ?? ''
        }
      }

    case 'RichTextBlock':
      return {
        key,
        type: BlockType.RichText,
        value: {value: block.richText, selection: null}
      }

    case 'QuoteBlock':
      return {
        key,
        type: BlockType.Quote,
        value: {quote: block.quote ?? '', author: block.author ?? ''}
      }

    case 'FacebookPostBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.FacebookPost, userID: block.userID, postID: block.postID}
      }

    case 'InstagramPostBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.InstagramPost, postID: block.postID}
      }

    case 'TwitterTweetBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.TwitterTweet, userID: block.userID, tweetID: block.tweetID}
      }

    case 'VimeoVideoBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.VimeoVideo, videoID: block.videoID}
      }

    case 'YouTubeVideoBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.YouTubeVideo, videoID: block.videoID}
      }

    case 'SoundCloudTrackBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.SoundCloudTrack, trackID: block.trackID}
      }

    case 'EmbedBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {
          type: EmbedType.Other,
          url: block.url,
          title: block.title,
          width: block.width,
          height: block.height
        }
      }

    case 'ArticleTeaserGridBlock':
      return {
        key,
        type: block.numColumns === 1 ? BlockType.ArticleTeaserGrid1 : BlockType.ArticleTeaserGrid6,
        value: {
          numColumns: block.numColumns,
          teasers: block.teasers.map((teaser: any) => [nanoid(), teaser])
        }
      }

    case 'LinkPageBreakBlock':
      return {
        key,
        type: BlockType.LinkPageBreak,
        value: {
          text: block.text ?? '',
          linkText: block.linkText ?? '',
          linkURL: block.linkURL ?? ''
        }
      }

    default:
      throw new Error('Invalid Block')
  }
}
