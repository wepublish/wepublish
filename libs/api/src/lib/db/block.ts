import {BlockStyle, PollAnswer, Prisma} from '@prisma/client'
import {RichTextNode} from '@wepublish/richtext/api'
import {MapDiscriminatedUnion} from '../utility'

export interface MetadataProperty {
  readonly key: string
  readonly value: string
  readonly public: boolean
}

export enum BlockType {
  Title = 'title',
  RichText = 'richText',
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
  Embed = 'embed',
  Quote = 'quote',
  Image = 'image',
  ImageGallery = 'imageGallery',
  Listicle = 'listicle',
  LinkPageBreak = 'linkPageBreak',
  TeaserGrid = 'teaserGrid',
  TeaserGridFlex = 'teaserGridFlex',
  TeaserList = 'teaserList',
  TeaserSlots = 'teaserSlots',
  HTML = 'html',
  Poll = 'poll',
  Comment = 'comment',
  Event = 'event',
  Subscribe = 'subscribe'
}

export interface BaseBlock {
  blockStyle?: BlockStyle['id']
}

export interface RichTextBlock extends BaseBlock {
  type: BlockType.RichText
  richText: RichTextNode[]
}

export interface ImageBlock extends BaseBlock {
  type: BlockType.Image
  caption?: string
  linkUrl?: string
  imageID?: string
}

export interface ImageCaptionEdge extends BaseBlock {
  caption: string
  imageID: string
}

export interface ImageGalleryBlock extends BaseBlock {
  type: BlockType.ImageGallery
  images: ImageCaptionEdge[]
}

export interface FacebookPostBlock extends BaseBlock {
  type: BlockType.FacebookPost
  userID: string
  postID: string
}

export interface FacebookVideoBlock extends BaseBlock {
  type: BlockType.FacebookVideo
  userID: string
  videoID: string
}

export interface InstagramPostBlock extends BaseBlock {
  type: BlockType.InstagramPost
  postID: string
}

export interface TwitterTweetBlock extends BaseBlock {
  type: BlockType.TwitterTweet
  userID: string
  tweetID: string
}

export interface VimeoVideoBlock extends BaseBlock {
  type: BlockType.VimeoVideo
  videoID: string
}

export interface YouTubeVideoBlock extends BaseBlock {
  type: BlockType.YouTubeVideo
  videoID: string
}

export interface SoundCloudTrackBlock extends BaseBlock {
  type: BlockType.SoundCloudTrack
  trackID: string
}

export interface PolisConversationBlock extends BaseBlock {
  type: BlockType.PolisConversation
  conversationID: string
}

export interface TikTokVideoBlock extends BaseBlock {
  type: BlockType.TikTokVideo
  videoID: string
  userID: string
}

export interface BildwurfAdBlock extends BaseBlock {
  type: BlockType.BildwurfAd
  zoneID: string
}

export interface EmbedBlock extends BaseBlock {
  type: BlockType.Embed
  url?: string
  title?: string
  width?: string
  height?: string
  styleCustom?: string
  sandbox?: string
}

export interface HTMLBlock extends BaseBlock {
  type: BlockType.HTML
  html: string
}

export interface SubscribeBlock extends BaseBlock {
  type: BlockType.Subscribe
}

export type PollAnswerWithVoteCount = PollAnswer & {
  votes: number
}

export interface PollBlock extends BaseBlock {
  type: BlockType.Poll
  pollId: string
}

export interface EventBlock extends BaseBlock {
  type: BlockType.Event
  filter: Partial<{
    tags: string[]
    events: string[]
  }>
}

export interface CommentBlock extends BaseBlock {
  type: BlockType.Comment
  filter: Partial<{
    item: string
    tags: string[]
    comments: string[]
  }>
}

export interface ListicleItem extends BaseBlock {
  title: string
  imageID?: string
  richText: RichTextNode[]
}

export interface ListicleBlock extends BaseBlock {
  type: BlockType.Listicle
  items: ListicleItem[]
}

export interface LinkPageBreakBlock extends BaseBlock {
  type: BlockType.LinkPageBreak
  text: string
  richText: RichTextNode[]
  linkURL: string
  linkText: string
  linkTarget: string
  hideButton: boolean
  styleOption?: string
  layoutOption?: string
  templateOption?: string
  imageID?: string
}

export interface TitleBlock extends BaseBlock {
  type: BlockType.Title
  title?: string
  lead?: string
}

export interface QuoteBlock extends BaseBlock {
  type: BlockType.Quote
  quote?: string
  author?: string
  imageID?: string
}

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
  Page = 'page',
  Event = 'event',
  Custom = 'custom',
  Advertisement = 'advertisement'
}

export enum TeaserStyle {
  Default = 'default',
  Light = 'light',
  Text = 'text'
}

export interface ArticleTeaser {
  type: TeaserType.Article
  style: TeaserStyle
  articleID: string

  imageID?: string
  title?: string
  lead?: string
}

export interface PeerArticleTeaser {
  type: TeaserType.PeerArticle
  style: TeaserStyle
  peerID: string
  articleID: string

  imageID?: string
  preTitle?: string
  title?: string
  lead?: string
}

export interface PageTeaser {
  type: TeaserType.Page
  style: TeaserStyle
  pageID: string

  imageID?: string
  preTitle?: string
  title?: string
  lead?: string
}

export interface EventTeaser {
  type: TeaserType.Event
  style: TeaserStyle
  eventID: string

  imageID?: string
  preTitle?: string
  title?: string
  lead?: string
}

export interface CustomTeaser {
  type: TeaserType.Custom
  contentUrl?: string
  style: TeaserStyle
  imageID?: string

  preTitle?: string
  title?: string
  lead?: string
  properties?: MetadataProperty[]
}

export interface AdvertisementTeaser {
  type: TeaserType.Advertisement
  zone: string
  properties?: MetadataProperty[]
}

export type Teaser =
  | ArticleTeaser
  | PeerArticleTeaser
  | PageTeaser
  | CustomTeaser
  | EventTeaser
  | AdvertisementTeaser

export enum TeaserSlotType {
  Autofill = 'Autofill',
  Manual = 'Manual'
}

export type TeaserSlot = {
  type: TeaserSlotType
  teaser?: Teaser
}

export enum TeaserListBlockSort {
  PublishedAt = 'publishedAt',
  HotAndTrending = 'hotAndTrending'
}

export interface TeaserListBlock extends BaseBlock {
  type: BlockType.TeaserList
  teaserType: TeaserType
  skip: number
  take: number
  sort?: TeaserListBlockSort
  filter: Partial<{
    tags: string[]
  }>
}

export interface TeaserGridBlock extends BaseBlock {
  type: BlockType.TeaserGrid
  teasers: Teaser[]
  numColumns: number
}

export interface TeaserSlotsBlockAutofillConfig {
  enabled: boolean
  tags?: string[]
  limit?: number
  skip?: number
  sort?: TeaserListBlockSort
}

export interface TeaserSlotsBlock extends BaseBlock {
  type: BlockType.TeaserSlots
  teasers: Teaser[]
  teaserType: TeaserType
  slots: TeaserSlot[]
}

export interface FlexAlignment {
  i: string
  x: number
  y: number
  w: number
  h: number
  static: boolean
}

export interface FlexTeaser {
  alignment: FlexAlignment
  teaser: Teaser | null
}

export interface TeaserGridFlexBlock extends BaseBlock {
  type: BlockType.TeaserGridFlex
  flexTeasers: FlexTeaser[]
}

export type ArticleBlock =
  | RichTextBlock
  | ImageBlock
  | ImageGalleryBlock
  | TitleBlock
  | QuoteBlock
  | ListicleBlock
  | LinkPageBreakBlock
  | EmbedBlock
  | HTMLBlock
  | CommentBlock
  | PollBlock
  | EventBlock
  | FacebookPostBlock
  | InstagramPostBlock
  | TwitterTweetBlock
  | VimeoVideoBlock
  | YouTubeVideoBlock
  | SoundCloudTrackBlock
  | PolisConversationBlock
  | TikTokVideoBlock
  | BildwurfAdBlock
  | TeaserGridBlock
  | TeaserSlotsBlock
  | TeaserGridFlexBlock
  | Prisma.JsonValue

export type PageBlock = ArticleBlock
export type Block = ArticleBlock | PageBlock
export type BlockWithoutJSON = Exclude<ArticleBlock, Prisma.JsonValue>

export type BaseBlockMap = MapDiscriminatedUnion<BlockWithoutJSON, 'type'>
export type BlockMap = {
  [K in BlockWithoutJSON['type']]?: Omit<BaseBlockMap[K], 'type'>
}
