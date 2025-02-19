import {FullPoll, Tag} from '@wepublish/editor/api'
import nanoid from 'nanoid'
import {Node} from 'slate'

import {BlockListValue} from '../atoms/blockList'
import {ListValue} from '../atoms/listInput'
import {TeaserMetadataProperty} from '../panel/teaserEditPanel'
import {
  ArticleWithoutBlocksFragment,
  BlockContentInput,
  CommentBlockCommentFragment,
  EditorBlockType,
  FullBlockFragment,
  FullEventFragment,
  FullImageFragment,
  PageWithoutBlocksFragment,
  TeaserListBlockSort,
  TeaserType
} from '@wepublish/editor/api-v2'

export interface BaseBlockValue {
  blockStyle?: string | null
}

export interface RichTextBlockValue extends BaseBlockValue {
  richText: Node[]
}

export interface ImageBlockValue extends BaseBlockValue {
  image: FullImageFragment | null
  caption: string
  linkUrl?: string
}

export interface GalleryImageEdge {
  image: FullImageFragment | null
  caption: string
}

export interface ImageGalleryBlockValue extends BaseBlockValue {
  images: GalleryImageEdge[]
}

export interface ListicleItem {
  title: string | null | undefined
  image: FullImageFragment | null
  richText: Node[]
}

export interface ListicleBlockValue extends BaseBlockValue {
  items: ListValue<ListicleItem>[]
}

export interface TitleBlockValue extends BaseBlockValue {
  title: string
  lead: string
}

export interface HTMLBlockValue extends BaseBlockValue {
  html: string
}

export interface PollBlockValue extends BaseBlockValue {
  poll: Pick<FullPoll, 'id' | 'question'> | null | undefined
}

export interface EventBlockValue extends BaseBlockValue {
  filter: Partial<{
    tags: string[] | null
    events: string[] | null
  }>
  events: FullEventFragment[]
}

export interface CommentBlockValue extends BaseBlockValue {
  filter: Partial<{
    item: string | null
    tags: string[] | null
    comments: string[] | null
  }>
  comments: CommentBlockCommentFragment[]
}

export interface QuoteBlockValue extends BaseBlockValue {
  quote: string
  author: string
  image?: FullImageFragment | null
}

export interface LinkPageBreakBlockValue extends BaseBlockValue {
  text: string
  richText: RichTextBlockValue['richText']
  linkURL: string
  linkText: string
  linkTarget?: string
  hideButton: boolean
  image?: FullImageFragment | undefined
}

export enum EmbedType {
  FacebookPost = 'facebookPost',
  FacebookVideo = 'facebookVideo',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  PolisConversation = 'polisConversation',
  TikTokVideo = 'tikTokVideo',
  BildwurfAd = 'bildwurfAd',
  Other = 'other'
}

interface FacebookPostEmbed extends BaseBlockValue {
  type: EmbedType.FacebookPost
  userID: string | null | undefined
  postID: string | null | undefined
}

interface FacebookVideoEmbed extends BaseBlockValue {
  type: EmbedType.FacebookVideo
  userID: string | null | undefined
  videoID: string | null | undefined
}

interface InstagramPostEmbed extends BaseBlockValue {
  type: EmbedType.InstagramPost
  postID: string | null | undefined
}

interface TwitterTweetEmbed extends BaseBlockValue {
  type: EmbedType.TwitterTweet
  userID: string | null | undefined
  tweetID: string | null | undefined
}

interface VimeoVideoEmbed extends BaseBlockValue {
  type: EmbedType.VimeoVideo
  videoID: string | null | undefined
}

interface YouTubeVideoEmbed extends BaseBlockValue {
  type: EmbedType.YouTubeVideo
  videoID: string | null | undefined
}

interface SoundCloudTrackEmbed extends BaseBlockValue {
  type: EmbedType.SoundCloudTrack
  trackID: string | null | undefined
}

interface PolisConversationEmbed extends BaseBlockValue {
  type: EmbedType.PolisConversation
  conversationID: string | null | undefined
}

interface TikTokVideoEmbed extends BaseBlockValue {
  type: EmbedType.TikTokVideo
  videoID: string | null | undefined
  userID: string | null | undefined
}

interface BildwurfAdEmbed extends BaseBlockValue {
  type: EmbedType.BildwurfAd
  zoneID: string | null | undefined
}

export interface OtherEmbed extends BaseBlockValue {
  type: EmbedType.Other
  url?: string
  title?: string
  width?: number
  height?: number
  styleCustom?: string
  sandbox?: string
}

export type EmbedBlockValue =
  | FacebookPostEmbed
  | FacebookVideoEmbed
  | InstagramPostEmbed
  | TwitterTweetEmbed
  | VimeoVideoEmbed
  | YouTubeVideoEmbed
  | SoundCloudTrackEmbed
  | PolisConversationEmbed
  | TikTokVideoEmbed
  | BildwurfAdEmbed
  | OtherEmbed

export enum MetaDataType {
  General = 'general',
  SocialMedia = 'socialMedia',
  Properties = 'properties',
  Comments = 'Comments',
  Tracking = 'Tracking'
}

export interface ArticleTeaserLink {
  type: TeaserType.Article
  article: ArticleWithoutBlocksFragment
}

export interface PageTeaserLink {
  type: TeaserType.Page
  page: PageWithoutBlocksFragment
}

export interface EventTeaserLink {
  type: TeaserType.Event
  event: FullEventFragment
}

export interface CustomTeaserLink extends BaseTeaser {
  type: TeaserType.Custom
  contentUrl?: string | null
  properties?: TeaserMetadataProperty[]
}

export type TeaserLink = ArticleTeaserLink | PageTeaserLink | CustomTeaserLink | EventTeaserLink

export interface BaseTeaser {
  image?: FullImageFragment | null
  preTitle?: string | null
  title?: string | null
  lead?: string | null
}

export interface ArticleTeaser extends ArticleTeaserLink, BaseTeaser {}
export interface PageTeaser extends PageTeaserLink, BaseTeaser {}
export interface CustomTeaser extends CustomTeaserLink, BaseTeaser {}
export interface EventTeaser extends EventTeaserLink, BaseTeaser {}

export type Teaser = ArticleTeaser | PageTeaser | CustomTeaser | EventTeaser

export interface TeaserListBlockValue extends BaseBlockValue {
  title?: string | null
  filter: {
    tags?: string[] | null
    tagObjects: Pick<Tag, 'id' | 'tag'>[]
  }
  teaserType: TeaserType
  skip: number
  take: number
  sort?: TeaserListBlockSort | null
  teasers: Array<[string, Teaser]>
}

export interface TeaserGridBlockValue extends BaseBlockValue {
  teasers: Array<[string, Teaser | null]>
  numColumns: number
}

export interface FlexAlignment {
  i: string
  x: number
  y: number
  w: number
  h: number
  static?: boolean
}

export interface FlexTeaser {
  alignment: FlexAlignment
  teaser: Teaser | null
}

export interface TeaserGridFlexBlockValue extends BaseBlockValue {
  flexTeasers: FlexTeaser[]
}

export type RichTextBlockListValue = BlockListValue<EditorBlockType.RichText, RichTextBlockValue>
export type ImageBlockListValue = BlockListValue<EditorBlockType.Image, ImageBlockValue>
export type ImageGalleryBlockListValue = BlockListValue<
  EditorBlockType.ImageGallery,
  ImageGalleryBlockValue
>
export type ListicleBlockListValue = BlockListValue<EditorBlockType.Listicle, ListicleBlockValue>
export type TitleBlockListValue = BlockListValue<EditorBlockType.Title, TitleBlockValue>
export type QuoteBlockListValue = BlockListValue<EditorBlockType.Quote, QuoteBlockValue>
export type EmbedBlockListValue = BlockListValue<EditorBlockType.Embed, EmbedBlockValue>
export type LinkPageBreakBlockListValue = BlockListValue<
  EditorBlockType.LinkPageBreak,
  LinkPageBreakBlockValue
>

export type TeaserListBlockListValue = BlockListValue<
  EditorBlockType.TeaserList,
  TeaserListBlockValue
>
export type TeaserGridBlock1ListValue = BlockListValue<
  EditorBlockType.TeaserGrid1,
  TeaserGridBlockValue
>
export type TeaserGridBlock6ListValue = BlockListValue<
  EditorBlockType.TeaserGrid6,
  TeaserGridBlockValue
>

export type TeaserGridFlexBlockListValue = BlockListValue<
  EditorBlockType.TeaserGridFlex,
  TeaserGridFlexBlockValue
>

export type HTMLBlockListValue = BlockListValue<EditorBlockType.Html, HTMLBlockValue>

export type PollBlockListValue = BlockListValue<EditorBlockType.Poll, PollBlockValue>

export type CommentBlockListValue = BlockListValue<EditorBlockType.Comment, CommentBlockValue>

export type EventBlockListValue = BlockListValue<EditorBlockType.Event, EventBlockValue>

export type BlockValue =
  | TitleBlockListValue
  | RichTextBlockListValue
  | ImageBlockListValue
  | ImageGalleryBlockListValue
  | ListicleBlockListValue
  | QuoteBlockListValue
  | EmbedBlockListValue
  | LinkPageBreakBlockListValue
  | TeaserGridBlock1ListValue
  | TeaserGridBlock6ListValue
  | TeaserGridFlexBlockListValue
  | HTMLBlockListValue
  | PollBlockListValue
  | CommentBlockListValue
  | EventBlockListValue
  | TeaserListBlockListValue

export function unionMapForBlock(block: BlockValue): BlockContentInput {
  switch (block.type) {
    case EditorBlockType.Comment:
      return {
        comment: {
          filter: {
            item: block.value?.filter.item,
            tags: block.value?.filter.tags ?? [],
            comments: block.value?.filter.comments ?? []
          },
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Poll:
      return {
        poll: {
          pollId: block.value?.poll?.id,
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Event:
      return {
        event: {
          filter: {
            events: block.value?.filter.events ?? [],
            tags: block.value?.filter.tags ?? []
          },
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Html:
      return {
        html: {
          html: block.value?.html,
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Image:
      return {
        image: {
          imageID: block.value.image?.id,
          caption: block.value.caption || undefined,
          linkUrl: block.value.linkUrl,
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.ImageGallery:
      return {
        imageGallery: {
          images: block.value.images.map(item => ({
            caption: item.caption,
            imageID: item.image?.id
          })),
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Listicle:
      return {
        listicle: {
          items: block.value.items.map(({value: {title, richText, image}}) => ({
            title,
            richText,
            imageID: image?.id
          })),
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Title:
      return {
        title: {
          title: block.value.title || undefined,
          lead: block.value.lead || undefined,
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.RichText:
      return {
        richText: {
          richText: block.value.richText,
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Quote:
      return {
        quote: {
          quote: block.value.quote || undefined,
          author: block.value.author || undefined,
          imageID: block.value.image?.id || undefined,
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.LinkPageBreak:
      return {
        linkPageBreak: {
          text: block.value.text || undefined,
          linkText: block.value.linkText || undefined,
          linkURL: block.value.linkURL || undefined,
          richText: block.value.richText,
          linkTarget: block.value.linkTarget || undefined,
          hideButton: block.value.hideButton,
          imageID: block.value.image?.id || undefined,
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.Embed: {
      const {value} = block

      switch (value.type) {
        case EmbedType.FacebookPost:
          return {
            facebookPost: {
              userID: value.userID,
              postID: value.postID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.FacebookVideo:
          return {
            facebookVideo: {
              userID: value.userID,
              videoID: value.videoID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.InstagramPost:
          return {
            instagramPost: {
              postID: value.postID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.TwitterTweet:
          return {
            twitterTweet: {
              userID: value.userID,
              tweetID: value.tweetID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.VimeoVideo:
          return {
            vimeoVideo: {
              videoID: value.videoID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.YouTubeVideo:
          return {
            youTubeVideo: {
              videoID: value.videoID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.SoundCloudTrack:
          return {
            soundCloudTrack: {
              trackID: value.trackID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.PolisConversation:
          return {
            polisConversation: {
              conversationID: value.conversationID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.TikTokVideo:
          return {
            tikTokVideo: {
              videoID: value.videoID,
              userID: value.userID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.BildwurfAd:
          return {
            bildwurfAd: {
              zoneID: value.zoneID,
              blockStyle: block.value.blockStyle
            }
          }

        case EmbedType.Other:
          return {
            embed: {
              title: value.title,
              url: value.url,
              width: value.width,
              height: value.height,
              styleCustom: value.styleCustom,
              sandbox: value.sandbox,
              blockStyle: block.value.blockStyle
            }
          }
      }
      break
    }

    case EditorBlockType.TeaserList:
      return {
        teaserList: {
          title: block.value.title,
          filter: {
            tags: block.value.filter.tags || []
          },
          take: block.value.take,
          skip: block.value.skip,
          blockStyle: block.value.blockStyle,
          teaserType: block.value.teaserType,
          sort: block.value.sort
        }
      }

    case EditorBlockType.TeaserGridFlex:
      return {
        teaserGridFlex: {
          flexTeasers: block.value.flexTeasers.map(flexTeaser => {
            switch (flexTeaser.teaser?.type) {
              case TeaserType.Article:
                return {
                  teaser: {
                    article: {
                      imageID: flexTeaser.teaser.image?.id,
                      preTitle: flexTeaser.teaser.preTitle || undefined,
                      title: flexTeaser.teaser.title || undefined,
                      lead: flexTeaser.teaser.lead || undefined,
                      articleID: flexTeaser.teaser.article.id
                    }
                  },
                  alignment: {
                    i: flexTeaser.alignment.i,
                    x: flexTeaser.alignment.x,
                    y: flexTeaser.alignment.y,
                    w: flexTeaser.alignment.w,
                    h: flexTeaser.alignment.h,
                    static: flexTeaser.alignment.static ?? false
                  }
                }

              case TeaserType.Page:
                return {
                  teaser: {
                    page: {
                      imageID: flexTeaser.teaser.image?.id,
                      preTitle: flexTeaser.teaser.preTitle || undefined,
                      title: flexTeaser.teaser.title || undefined,
                      lead: flexTeaser.teaser.lead || undefined,
                      pageID: flexTeaser.teaser.page.id
                    }
                  },
                  alignment: {
                    i: flexTeaser.alignment.i,
                    x: flexTeaser.alignment.x,
                    y: flexTeaser.alignment.y,
                    w: flexTeaser.alignment.w,
                    h: flexTeaser.alignment.h,
                    static: flexTeaser.alignment.static ?? false
                  }
                }

              case TeaserType.Event:
                return {
                  teaser: {
                    event: {
                      imageID: flexTeaser.teaser.image?.id,
                      preTitle: flexTeaser.teaser.preTitle || undefined,
                      title: flexTeaser.teaser.title || undefined,
                      lead: flexTeaser.teaser.lead || undefined,
                      eventID: flexTeaser.teaser.event.id
                    }
                  },
                  alignment: {
                    i: flexTeaser.alignment.i,
                    x: flexTeaser.alignment.x,
                    y: flexTeaser.alignment.y,
                    w: flexTeaser.alignment.w,
                    h: flexTeaser.alignment.h,
                    static: flexTeaser.alignment.static ?? false
                  }
                }

              case TeaserType.Custom:
                return {
                  teaser: {
                    custom: {
                      imageID: flexTeaser.teaser.image?.id,
                      preTitle: flexTeaser.teaser.preTitle || undefined,
                      title: flexTeaser.teaser.title || undefined,
                      lead: flexTeaser.teaser.lead || undefined,
                      contentUrl: flexTeaser.teaser.contentUrl || undefined,
                      properties: flexTeaser.teaser.properties || []
                    }
                  },
                  alignment: {
                    i: flexTeaser.alignment.i,
                    x: flexTeaser.alignment.x,
                    y: flexTeaser.alignment.y,
                    w: flexTeaser.alignment.w,
                    h: flexTeaser.alignment.h,
                    static: flexTeaser.alignment.static ?? false
                  }
                }

              default:
                return {
                  teaser: null,
                  alignment: {
                    i: flexTeaser.alignment.i,
                    x: flexTeaser.alignment.x,
                    y: flexTeaser.alignment.y,
                    w: flexTeaser.alignment.w,
                    h: flexTeaser.alignment.h,
                    static: flexTeaser.alignment.static ?? false
                  }
                }
            }
          }),
          blockStyle: block.value.blockStyle
        }
      }

    case EditorBlockType.TeaserGrid1:
    case EditorBlockType.TeaserGrid6:
      return {
        teaserGrid: {
          teasers: block.value.teasers.map(([, value]) => {
            switch (value?.type) {
              case TeaserType.Article:
                return {
                  article: {
                    imageID: value.image?.id,
                    preTitle: value.preTitle || undefined,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    articleID: value.article?.id
                  }
                }

              case TeaserType.Page:
                return {
                  page: {
                    imageID: value.image?.id,
                    preTitle: value.preTitle || undefined,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    pageID: value.page?.id
                  }
                }

              case TeaserType.Event:
                return {
                  event: {
                    imageID: value.image?.id,
                    preTitle: value.preTitle || undefined,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    eventID: value.event?.id
                  }
                }

              case TeaserType.Custom:
                return {
                  custom: {
                    imageID: value.image?.id,
                    preTitle: value.preTitle || undefined,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    contentUrl: value.contentUrl || undefined,
                    properties: value.properties || []
                  }
                }
            }

            return {}
          }),
          numColumns: block.value.numColumns,
          blockStyle: block.value.blockStyle
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
        type: EditorBlockType.Image,
        value: {
          blockStyle: block.blockStyle,
          caption: block.caption ?? '',
          linkUrl: block.linkUrl ?? '',
          image: block.image ? block.image : null
        }
      }

    case 'ImageGalleryBlock':
      return {
        key,
        type: EditorBlockType.ImageGallery,
        value: {
          blockStyle: block.blockStyle,
          images: block.images.map(({image, caption}) => ({
            image: image ?? null,
            caption: caption ?? ''
          }))
        }
      }

    case 'ListicleBlock':
      return {
        key,
        type: EditorBlockType.Listicle,
        value: {
          blockStyle: block.blockStyle,
          items: block.items.map(({title, richText, image}) => ({
            id: nanoid(),
            value: {
              title,
              image: image ?? null,
              richText
            }
          }))
        }
      }

    case 'TitleBlock': {
      return {
        key,
        type: EditorBlockType.Title,
        value: {
          blockStyle: block.blockStyle,
          title: block.title ?? '',
          lead: block.lead ?? ''
        }
      }
    }

    case 'RichTextBlock':
      return {
        key,
        type: EditorBlockType.RichText,
        value: {
          blockStyle: block.blockStyle,
          richText: block.richText
        }
      }

    case 'QuoteBlock':
      return {
        key,
        type: EditorBlockType.Quote,
        value: {
          blockStyle: block.blockStyle,
          quote: block.quote ?? '',
          author: block.author ?? '',
          image: block.image ?? null
        }
      }

    case 'FacebookPostBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.FacebookPost,
          userID: block.userID,
          postID: block.postID
        }
      }

    case 'FacebookVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.FacebookVideo,
          userID: block.userID,
          videoID: block.videoID
        }
      }

    case 'InstagramPostBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {blockStyle: block.blockStyle, type: EmbedType.InstagramPost, postID: block.postID}
      }

    case 'TwitterTweetBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.TwitterTweet,
          userID: block.userID,
          tweetID: block.tweetID
        }
      }

    case 'VimeoVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {blockStyle: block.blockStyle, type: EmbedType.VimeoVideo, videoID: block.videoID}
      }

    case 'YouTubeVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {blockStyle: block.blockStyle, type: EmbedType.YouTubeVideo, videoID: block.videoID}
      }

    case 'SoundCloudTrackBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.SoundCloudTrack,
          trackID: block.trackID
        }
      }

    case 'PolisConversationBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.PolisConversation,
          conversationID: block.conversationID
        }
      }

    case 'TikTokVideoBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.TikTokVideo,
          videoID: block.videoID,
          userID: block.userID
        }
      }

    case 'BildwurfAdBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {blockStyle: block.blockStyle, type: EmbedType.BildwurfAd, zoneID: block.zoneID}
      }

    case 'IFrameBlock':
      return {
        key,
        type: EditorBlockType.Embed,
        value: {
          blockStyle: block.blockStyle,
          type: EmbedType.Other,
          url: block.url ?? undefined,
          title: block.title ?? undefined,
          width: block.width ?? undefined,
          height: block.height ?? undefined,
          styleCustom: block.styleCustom ?? undefined,
          sandbox: block.sandbox ?? undefined
        }
      }

    case 'HTMLBlock':
      return {
        key,
        type: EditorBlockType.Html,
        value: {
          blockStyle: block.blockStyle,
          html: block.html ?? ''
        }
      }

    case 'TeaserListBlock':
      return {
        key,
        type: EditorBlockType.TeaserList,
        value: {
          title: block.title,
          blockStyle: block.blockStyle,
          filter: block.filter,
          skip: block.skip ?? 0,
          take: block.take ?? 6,
          sort: block.sort,
          teaserType: block.teaserType ?? TeaserType.Article,
          teasers: block.teasers.map((teaser, index) => [
            `${index}`,
            {
              ...teaser,
              type:
                teaser?.__typename === 'ArticleTeaser'
                  ? TeaserType.Article
                  : teaser?.__typename === 'PageTeaser'
                  ? TeaserType.Page
                  : teaser?.__typename === 'EventTeaser'
                  ? TeaserType.Event
                  : TeaserType.Custom
            } as Teaser
          ])
        }
      }

    case 'TeaserGridFlexBlock':
      return {
        key,
        type: EditorBlockType.TeaserGridFlex,
        value: {
          blockStyle: block.blockStyle,
          flexTeasers: block?.flexTeasers.map(flexTeaser => {
            switch (flexTeaser?.teaser?.__typename) {
              case 'ArticleTeaser':
                return {
                  teaser: flexTeaser?.teaser.article
                    ? {
                        type: TeaserType.Article,
                        image: flexTeaser.teaser.image ?? undefined,
                        preTitle: flexTeaser.teaser.preTitle ?? undefined,
                        title: flexTeaser.teaser.title ?? undefined,
                        lead: flexTeaser.teaser.lead ?? undefined,
                        article: flexTeaser.teaser.article
                      }
                    : null,
                  alignment: {
                    i: flexTeaser?.alignment.i ?? nanoid(),
                    x: flexTeaser?.alignment.x ?? 1,
                    y: flexTeaser?.alignment.y ?? 1,
                    w: flexTeaser?.alignment.w ?? 1,
                    h: flexTeaser?.alignment.h ?? 1,
                    static: flexTeaser?.alignment.static ?? false
                  }
                }

              case 'PageTeaser':
                return {
                  teaser: flexTeaser?.teaser.page
                    ? {
                        type: TeaserType.Page,
                        image: flexTeaser?.teaser.image ?? undefined,
                        preTitle: flexTeaser?.teaser.preTitle ?? undefined,
                        title: flexTeaser?.teaser.title ?? undefined,
                        lead: flexTeaser?.teaser.lead ?? undefined,
                        page: flexTeaser?.teaser.page
                      }
                    : null,
                  alignment: {
                    i: flexTeaser?.alignment.i ?? nanoid(),
                    x: flexTeaser?.alignment.x ?? 1,
                    y: flexTeaser?.alignment.y ?? 1,
                    w: flexTeaser?.alignment.w ?? 1,
                    h: flexTeaser?.alignment.h ?? 1,
                    static: flexTeaser?.alignment.static ?? false
                  }
                }

              case 'EventTeaser':
                return {
                  teaser: flexTeaser?.teaser.event
                    ? {
                        type: TeaserType.Event,
                        image: flexTeaser?.teaser.image ?? undefined,
                        preTitle: flexTeaser?.teaser.preTitle ?? undefined,
                        title: flexTeaser?.teaser.title ?? undefined,
                        lead: flexTeaser?.teaser.lead ?? undefined,
                        event: flexTeaser?.teaser.event
                      }
                    : null,
                  alignment: {
                    i: flexTeaser?.alignment.i ?? nanoid(),
                    x: flexTeaser?.alignment.x ?? 1,
                    y: flexTeaser?.alignment.y ?? 1,
                    w: flexTeaser?.alignment.w ?? 1,
                    h: flexTeaser?.alignment.h ?? 1,
                    static: flexTeaser?.alignment.static ?? false
                  }
                }

              case 'CustomTeaser':
                return {
                  teaser: flexTeaser?.teaser
                    ? {
                        type: TeaserType.Custom,
                        image: flexTeaser?.teaser.image ?? undefined,
                        preTitle: flexTeaser?.teaser.preTitle ?? undefined,
                        title: flexTeaser?.teaser.title ?? undefined,
                        lead: flexTeaser?.teaser.lead ?? undefined,
                        contentUrl: flexTeaser?.teaser.contentUrl ?? undefined,
                        properties: flexTeaser?.teaser?.properties ?? undefined
                      }
                    : null,
                  alignment: {
                    i: flexTeaser?.alignment.i ?? nanoid(),
                    x: flexTeaser?.alignment.x ?? 1,
                    y: flexTeaser?.alignment.y ?? 1,
                    w: flexTeaser?.alignment.w ?? 1,
                    h: flexTeaser?.alignment.h ?? 1,
                    static: flexTeaser?.alignment.static ?? false
                  }
                }

              default:
                return {
                  teaser: null,
                  alignment: {
                    i: flexTeaser?.alignment.i ?? nanoid(),
                    x: flexTeaser?.alignment.x ?? 1,
                    y: flexTeaser?.alignment.y ?? 1,
                    w: flexTeaser?.alignment.w ?? 3,
                    h: flexTeaser?.alignment.h ?? 4,
                    static: flexTeaser?.alignment.static ?? false
                  }
                }
            }
          })
        }
      }

    case 'TeaserGridBlock':
      return {
        key,
        type: EditorBlockType.TeaserGrid1,
        value: {
          blockStyle: block.blockStyle,
          numColumns: block.numColumns,
          teasers: block.teasers.map(teaser => {
            switch (teaser?.__typename) {
              case 'ArticleTeaser':
                return [
                  nanoid(),
                  teaser.article
                    ? {
                        type: TeaserType.Article,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        article: teaser.article
                      }
                    : null
                ]

              case 'PageTeaser':
                return [
                  nanoid(),
                  teaser.page
                    ? {
                        type: TeaserType.Page,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        page: teaser.page
                      }
                    : null
                ]

              case 'EventTeaser':
                return [
                  nanoid(),
                  teaser.event
                    ? {
                        type: TeaserType.Event,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        event: teaser.event
                      }
                    : null
                ]

              case 'CustomTeaser':
                return [
                  nanoid(),
                  teaser
                    ? {
                        type: TeaserType.Custom,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        contentUrl: teaser.contentUrl ?? undefined,
                        properties: teaser?.properties ?? undefined
                      }
                    : null
                ]

              default:
                return [nanoid(), null]
            }
          })
        }
      }

    case 'BreakBlock':
      return {
        key,
        type: EditorBlockType.LinkPageBreak,
        value: {
          blockStyle: block.blockStyle,
          text: block.text ?? '',
          linkText: block.linkText ?? '',
          linkURL: block.linkURL ?? '',
          richText: block.richText,
          linkTarget: block.linkTarget ?? '',
          hideButton: block.hideButton ?? false,
          image: block.image ?? undefined
        }
      }

    case 'PollBlock':
      return {
        key,
        type: EditorBlockType.Poll,
        value: {
          blockStyle: block.blockStyle,
          poll: block.poll
        }
      }

    case 'EventBlock':
      return {
        key,
        type: EditorBlockType.Event,
        value: {
          blockStyle: block.blockStyle,
          filter: block.filter,
          events: block.events
        }
      }

    case 'CommentBlock':
      return {
        key,
        type: EditorBlockType.Comment,
        value: {
          blockStyle: block.blockStyle,
          filter: block.filter,
          comments: block.comments
        }
      }

    default:
      throw new Error('Invalid Block')
  }
}
