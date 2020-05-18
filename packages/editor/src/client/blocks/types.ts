import {BlockListValue} from '@karma.run/ui'
import {Node, Range} from 'slate'

import nanoid from 'nanoid'

import {
  FullBlockFragment,
  ImageRefFragment,
  ArticleRefFragment,
  BlockInput,
  PeerRefFragment,
  PageRefFragment,
  TeaserStyle
} from '../api'

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

export type RichTextValue = Node[]

export interface RichTextBlockValue {
  readonly value: RichTextValue
  readonly selection: Range | null
}

export interface ImageBlockValue {
  readonly image: ImageRefFragment | null
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

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
  Page = 'page'
}

export interface ArticleTeaserLink {
  type: TeaserType.Article
  article: ArticleRefFragment
}

export interface PeerArticleTeaserLink {
  type: TeaserType.PeerArticle
  peer: PeerRefFragment
  articleID: string
  article?: ArticleRefFragment
}

export interface PageTeaserLink {
  type: TeaserType.Page
  page: PageRefFragment
}

export type TeaserLink = ArticleTeaserLink | PeerArticleTeaserLink | PageTeaserLink

export interface BaseTeaser {
  style: TeaserStyle
  image?: ImageRefFragment
  preTitle?: string
  title?: string
  lead?: string
}

export interface ArticleTeaser extends ArticleTeaserLink, BaseTeaser {}
export interface PeerArticleTeaser extends PeerArticleTeaserLink, BaseTeaser {}
export interface PageTeaser extends PageTeaserLink, BaseTeaser {}

export type Teaser = ArticleTeaser | PeerArticleTeaser | PageTeaser

export interface TeaserGridBlockValue {
  readonly teasers: Array<[string, Teaser | null]>
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

export function unionMapForBlock(block: BlockValue): BlockInput {
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
        teaserGrid: {
          teasers: block.value.teasers.map(([, value]) => {
            switch (value?.type) {
              case TeaserType.Article:
                return {
                  article: {
                    style: value.style,
                    imageID: value.image?.id,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    articleID: value.article.id
                  }
                }

              case TeaserType.PeerArticle:
                return {
                  peerArticle: {
                    style: value.style,
                    imageID: value.image?.id,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    peerID: value.peer.id,
                    articleID: value.articleID
                  }
                }

              case TeaserType.Page:
                return {
                  page: {
                    style: value.style,
                    imageID: value.image?.id,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    pageID: value.page.id
                  }
                }

              default:
                return null
            }
          }),
          numColumns: block.value.numColumns
        }
      }
  }
}

export function blockForQueryBlock(block: FullBlockFragment | null): BlockValue {
  const key: string = nanoid()

  switch (block?.__typename) {
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
          url: block.url ?? undefined,
          title: block.title ?? undefined,
          width: block.width ?? undefined,
          height: block.height ?? undefined
        }
      }

    case 'TeaserGridBlock':
      return {
        key,
        type: block.numColumns === 1 ? BlockType.ArticleTeaserGrid1 : BlockType.ArticleTeaserGrid6,
        value: {
          numColumns: block.numColumns,
          teasers: block.teasers.map(teaser => {
            switch (teaser?.__typename) {
              case 'ArticleTeaser':
                return [
                  nanoid(),
                  teaser.article
                    ? {
                        type: TeaserType.Article,
                        style: teaser.style,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        article: teaser.article
                      }
                    : null
                ]

              case 'PeerArticleTeaser':
              case 'PeerArticleTeaser':
                return [
                  nanoid(),
                  teaser.peer
                    ? {
                        type: TeaserType.PeerArticle,
                        style: teaser.style,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        peer: teaser.peer,
                        articleID: teaser.articleID,
                        article: teaser.article ?? undefined
                      }
                    : null
                ]

              case 'PageTeaser':
                return [
                  nanoid(),
                  teaser.page
                    ? {
                        type: TeaserType.Page,
                        style: teaser.style,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        page: teaser.page
                      }
                    : null
                ]

              default:
                return [nanoid(), null]
            }
          })
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
