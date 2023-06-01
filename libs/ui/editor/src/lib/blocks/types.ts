import {
  ArticleRefFragment,
  BlockInput,
  EventRefFragment,
  FullBlockFragment,
  FullCommentFragment,
  FullPoll,
  ImageRefFragment,
  PageRefFragment,
  PeerRefFragment,
  TeaserStyle
} from '@wepublish/editor/api'
import nanoid from 'nanoid'
import {Node} from 'slate'

import {BlockListValue} from '../atoms/blockList'
import {ListValue} from '../atoms/listInput'
import {TeaserMetadataProperty} from '../panel/teaserEditPanel'

export enum BlockType {
  RichText = 'richText',
  Title = 'title',
  Image = 'image',
  ImageGallery = 'imageGallery',
  Listicle = 'listicle',
  Quote = 'quote',
  Embed = 'embed',
  LinkPageBreak = 'linkPageBreak',
  TeaserGrid1 = 'teaserGrid1',
  TeaserGrid6 = 'teaserGrid6',
  TeaserGridFlex = 'teaserGridFlex',
  HTMLBlock = 'html',
  PollBlock = 'poll',
  CommentBlock = 'comment',
  EventBlock = 'event'
}

export type RichTextBlockValue = Node[]

export interface ImageBlockValue {
  image: ImageRefFragment | null
  caption: string
}

export interface GalleryImageEdge {
  image: ImageRefFragment | null
  caption: string
}

export interface ImageGalleryBlockValue {
  images: GalleryImageEdge[]
}

export interface ListicleItem {
  title: string
  image: ImageRefFragment | null
  richText: RichTextBlockValue
}

export interface ListicleBlockValue {
  items: ListValue<ListicleItem>[]
}

export interface TitleBlockValue {
  title: string
  lead: string
}

export interface HTMLBlockValue {
  html: string
}

export interface PollBlockValue {
  poll: Pick<FullPoll, 'id' | 'question'> | null | undefined
}

export interface EventBlockValue {
  filter: Partial<{
    tags: string[] | null
    events: string[] | null
  }>
  events: EventRefFragment[]
}

export interface CommentBlockValue {
  filter: Partial<{
    item: string | null
    tags: string[] | null
    comments: string[] | null
  }>
  comments: FullCommentFragment[]
}

export interface QuoteBlockValue {
  quote: string
  author: string
}

export interface LinkPageBreakBlockValue {
  text: string
  richText: RichTextBlockValue
  linkURL: string
  linkText: string
  linkTarget?: string
  hideButton: boolean
  styleOption?: string
  layoutOption?: string
  templateOption?: string
  image?: ImageRefFragment | undefined
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

interface FacebookPostEmbed {
  type: EmbedType.FacebookPost
  userID: string
  postID: string
}

interface FacebookVideoEmbed {
  type: EmbedType.FacebookVideo
  userID: string
  videoID: string
}

interface InstagramPostEmbed {
  type: EmbedType.InstagramPost
  postID: string
}

interface TwitterTweetEmbed {
  type: EmbedType.TwitterTweet
  userID: string
  tweetID: string
}

interface VimeoVideoEmbed {
  type: EmbedType.VimeoVideo
  videoID: string
}

interface YouTubeVideoEmbed {
  type: EmbedType.YouTubeVideo
  videoID: string
}

interface SoundCloudTrackEmbed {
  type: EmbedType.SoundCloudTrack
  trackID: string
}

interface PolisConversationEmbed {
  type: EmbedType.PolisConversation
  conversationID: string
}

interface TikTokVideoEmbed {
  type: EmbedType.TikTokVideo
  videoID: string
  userID: string
}

interface BildwurfAdEmbed {
  type: EmbedType.BildwurfAd
  zoneID: string
}

export interface OtherEmbed {
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

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
  Page = 'page',
  Custom = 'custom',
  Event = 'event'
}

export enum MetaDataType {
  General = 'general',
  SocialMedia = 'socialMedia',
  Properties = 'properties',
  Comments = 'Comments'
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

export interface EventTeaserLink {
  type: TeaserType.Event
  event: EventRefFragment
}

export interface CustomTeaserLink extends BaseTeaser {
  type: TeaserType.Custom
  contentUrl?: string
  properties?: TeaserMetadataProperty[]
}

export type TeaserLink =
  | ArticleTeaserLink
  | PeerArticleTeaserLink
  | PageTeaserLink
  | CustomTeaserLink
  | EventTeaserLink

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
export interface CustomTeaser extends CustomTeaserLink, BaseTeaser {}
export interface EventTeaser extends EventTeaserLink, BaseTeaser {}

export type Teaser = ArticleTeaser | PeerArticleTeaser | PageTeaser | CustomTeaser | EventTeaser

export interface TeaserGridBlockValue {
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

export interface TeaserGridFlexBlockValue {
  flexTeasers: FlexTeaser[]
}

export type RichTextBlockListValue = BlockListValue<BlockType.RichText, RichTextBlockValue>
export type ImageBlockListValue = BlockListValue<BlockType.Image, ImageBlockValue>
export type ImageGalleryBlockListValue = BlockListValue<
  BlockType.ImageGallery,
  ImageGalleryBlockValue
>
export type ListicleBlockListValue = BlockListValue<BlockType.Listicle, ListicleBlockValue>
export type TitleBlockListValue = BlockListValue<BlockType.Title, TitleBlockValue>
export type QuoteBlockListValue = BlockListValue<BlockType.Quote, QuoteBlockValue>
export type EmbedBlockListValue = BlockListValue<BlockType.Embed, EmbedBlockValue>
export type LinkPageBreakBlockListValue = BlockListValue<
  BlockType.LinkPageBreak,
  LinkPageBreakBlockValue
>

export type TeaserGridBlock1ListValue = BlockListValue<BlockType.TeaserGrid1, TeaserGridBlockValue>

export type TeaserGridBlock6ListValue = BlockListValue<BlockType.TeaserGrid6, TeaserGridBlockValue>

export type TeaserGridFlexBlockListValue = BlockListValue<
  BlockType.TeaserGridFlex,
  TeaserGridFlexBlockValue
>

export type HTMLBlockListValue = BlockListValue<BlockType.HTMLBlock, HTMLBlockValue>

export type PollBlockListValue = BlockListValue<BlockType.PollBlock, PollBlockValue>

export type CommentBlockListValue = BlockListValue<BlockType.CommentBlock, CommentBlockValue>

export type EventBlockListValue = BlockListValue<BlockType.EventBlock, EventBlockValue>

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

export function unionMapForBlock(block: BlockValue): BlockInput {
  switch (block.type) {
    case BlockType.CommentBlock:
      return {
        comment: {
          filter: {
            item: block.value?.filter.item,
            tags: block.value?.filter.tags,
            comments: block.value?.filter.comments
          }
        }
      }

    case BlockType.PollBlock:
      return {
        poll: {
          pollId: block.value?.poll?.id
        }
      }

    case BlockType.EventBlock:
      return {
        event: {
          filter: {
            events: block.value?.filter.events,
            tags: block.value?.filter.tags
          }
        }
      }

    case BlockType.HTMLBlock:
      return {
        html: {
          html: block.value?.html
        }
      }

    case BlockType.Image:
      return {
        image: {
          imageID: block.value.image?.id,
          caption: block.value.caption || undefined
        }
      }

    case BlockType.ImageGallery:
      return {
        imageGallery: {
          images: block.value.images.map(item => ({
            caption: item.caption,
            imageID: item.image?.id
          }))
        }
      }

    case BlockType.Listicle:
      return {
        listicle: {
          items: block.value.items.map(({value: {title, richText, image}}) => ({
            title,
            richText,
            imageID: image?.id
          }))
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
        richText: {richText: block.value}
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
          linkURL: block.value.linkURL || undefined,
          styleOption: block.value.styleOption || undefined,
          layoutOption: block.value.layoutOption || undefined,
          templateOption: block.value.templateOption || undefined,
          richText: block.value.richText,
          linkTarget: block.value.linkTarget || undefined,
          hideButton: block.value.hideButton,
          imageID: block.value.image?.id || undefined
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

        case EmbedType.FacebookVideo:
          return {
            facebookVideo: {
              userID: value.userID,
              videoID: value.videoID
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

        case EmbedType.PolisConversation:
          return {
            polisConversation: {
              conversationID: value.conversationID
            }
          }

        case EmbedType.TikTokVideo:
          return {
            tikTokVideo: {
              videoID: value.videoID,
              userID: value.userID
            }
          }

        case EmbedType.BildwurfAd:
          return {
            bildwurfAd: {
              zoneID: value.zoneID
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
              sandbox: value.sandbox
            }
          }
      }
      break
    }

    case BlockType.TeaserGridFlex:
      return {
        teaserGridFlex: {
          flexTeasers: block.value.flexTeasers.map(flexTeaser => {
            switch (flexTeaser.teaser?.type) {
              case TeaserType.Article:
                return {
                  teaser: {
                    article: {
                      style: flexTeaser.teaser.style,
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

              case TeaserType.PeerArticle:
                return {
                  teaser: {
                    peerArticle: {
                      style: flexTeaser.teaser.style,
                      imageID: flexTeaser.teaser.image?.id,
                      preTitle: flexTeaser.teaser.preTitle || undefined,
                      title: flexTeaser.teaser.title || undefined,
                      lead: flexTeaser.teaser.lead || undefined,
                      peerID: flexTeaser.teaser.peer.id,
                      articleID: flexTeaser.teaser.articleID
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
                      style: flexTeaser.teaser.style,
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
                      style: flexTeaser.teaser.style,
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
                      style: flexTeaser.teaser.style,
                      imageID: flexTeaser.teaser.image?.id,
                      preTitle: flexTeaser.teaser.preTitle || undefined,
                      title: flexTeaser.teaser.title || undefined,
                      lead: flexTeaser.teaser.lead || undefined,
                      contentUrl: flexTeaser.teaser.contentUrl || undefined,
                      properties:
                        flexTeaser.teaser.properties?.map(({key, value, public: isPublic}) => ({
                          key,
                          value,
                          public: isPublic
                        })) || []
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
          })
        }
      }

    case BlockType.TeaserGrid1:
    case BlockType.TeaserGrid6:
      return {
        teaserGrid: {
          teasers: block.value.teasers.map(([, value]) => {
            switch (value?.type) {
              case TeaserType.Article:
                return {
                  article: {
                    style: value.style,
                    imageID: value.image?.id,
                    preTitle: value.preTitle || undefined,
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
                    preTitle: value.preTitle || undefined,
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
                    preTitle: value.preTitle || undefined,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    pageID: value.page.id
                  }
                }

              case TeaserType.Event:
                return {
                  event: {
                    style: value.style,
                    imageID: value.image?.id,
                    preTitle: value.preTitle || undefined,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    eventID: value.event.id
                  }
                }

              case TeaserType.Custom:
                return {
                  custom: {
                    style: value.style,
                    imageID: value.image?.id,
                    preTitle: value.preTitle || undefined,
                    title: value.title || undefined,
                    lead: value.lead || undefined,
                    contentUrl: value.contentUrl || undefined,
                    properties:
                      value.properties?.map(({key, value, public: isPublic}) => ({
                        key,
                        value,
                        public: isPublic
                      })) || []
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

    case 'ImageGalleryBlock':
      return {
        key,
        type: BlockType.ImageGallery,
        value: {
          images: block.images.map(({image, caption}) => ({
            image: image ?? null,
            caption: caption ?? ''
          }))
        }
      }

    case 'ListicleBlock':
      return {
        key,
        type: BlockType.Listicle,
        value: {
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
        value: block.richText
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

    case 'FacebookVideoBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.FacebookVideo, userID: block.userID, videoID: block.videoID}
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

    case 'PolisConversationBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.PolisConversation, conversationID: block.conversationID}
      }

    case 'TikTokVideoBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.TikTokVideo, videoID: block.videoID, userID: block.userID}
      }

    case 'BildwurfAdBlock':
      return {
        key,
        type: BlockType.Embed,
        value: {type: EmbedType.BildwurfAd, zoneID: block.zoneID}
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
          height: block.height ?? undefined,
          styleCustom: block.styleCustom ?? undefined,
          sandbox: block.sandbox ?? undefined
        }
      }

    case 'HTMLBlock':
      return {
        key,
        type: BlockType.HTMLBlock,
        value: {
          html: block.html ?? ''
        }
      }

    case 'TeaserGridFlexBlock':
      return {
        key,
        type: BlockType.TeaserGridFlex,
        value: {
          flexTeasers: block?.flexTeasers.map(flexTeaser => {
            switch (flexTeaser?.teaser?.__typename) {
              case 'ArticleTeaser':
                return {
                  teaser: flexTeaser?.teaser.article
                    ? {
                        type: TeaserType.Article,
                        style: flexTeaser.teaser.style,
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

              case 'PeerArticleTeaser':
                return {
                  teaser: flexTeaser?.teaser.peer
                    ? {
                        type: TeaserType.PeerArticle,
                        style: flexTeaser?.teaser.style,
                        image: flexTeaser?.teaser.image ?? undefined,
                        preTitle: flexTeaser?.teaser.preTitle ?? undefined,
                        title: flexTeaser?.teaser.title ?? undefined,
                        lead: flexTeaser?.teaser.lead ?? undefined,
                        peer: flexTeaser?.teaser.peer,
                        articleID: flexTeaser?.teaser.articleID,
                        article: flexTeaser?.teaser.article ?? undefined
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
                        style: flexTeaser?.teaser.style,
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
                        style: flexTeaser?.teaser.style,
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
                        style: flexTeaser?.teaser.style,
                        image: flexTeaser?.teaser.image ?? undefined,
                        preTitle: flexTeaser?.teaser.preTitle ?? undefined,
                        title: flexTeaser?.teaser.title ?? undefined,
                        lead: flexTeaser?.teaser.lead ?? undefined,
                        contentUrl: flexTeaser?.teaser.contentUrl ?? undefined,
                        properties:
                          flexTeaser?.teaser?.properties?.map(({key, value, public: isPublic}) => ({
                            key,
                            value,
                            public: isPublic
                          })) ?? undefined
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
        type: block.numColumns === 1 ? BlockType.TeaserGrid1 : BlockType.TeaserGrid6,
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

              case 'EventTeaser':
                return [
                  nanoid(),
                  teaser.event
                    ? {
                        type: TeaserType.Event,
                        style: teaser.style,
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
                        style: teaser.style,
                        image: teaser.image ?? undefined,
                        preTitle: teaser.preTitle ?? undefined,
                        title: teaser.title ?? undefined,
                        lead: teaser.lead ?? undefined,
                        contentUrl: teaser.contentUrl ?? undefined,
                        properties:
                          teaser?.properties?.map(({key, value, public: isPublic}) => ({
                            key,
                            value,
                            public: isPublic
                          })) ?? undefined
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
          linkURL: block.linkURL ?? '',
          styleOption: block.styleOption ?? '',
          layoutOption: block.layoutOption ?? '',
          templateOption: block.templateOption ?? '',
          richText: block.richText,
          linkTarget: block.linkTarget ?? '',
          hideButton: block.hideButton,
          image: block.image ?? undefined
        }
      }

    case 'PollBlock':
      return {
        key,
        type: BlockType.PollBlock,
        value: {
          poll: block.poll
        }
      }

    case 'EventBlock':
      return {
        key,
        type: BlockType.EventBlock,
        value: {
          filter: block.filter,
          events: block.events
        }
      }

    case 'CommentBlock':
      return {
        key,
        type: BlockType.CommentBlock,
        value: {
          filter: block.filter,
          comments: block.comments
        }
      }

    default:
      throw new Error('Invalid Block')
  }
}
