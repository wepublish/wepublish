import {Node} from 'slate'
import {Route} from './route/routeContext'
import {RichTextBlockValue} from '@wepublish/editor/src/client/blocks/types'

export enum VersionState {
  Draft = 'draft',
  DraftReview = 'draftReview',
  Published = 'published'
}

export interface ImageData {
  url: string
  width: number
  height: number
  description?: string
  caption?: string
  author?: string
  focusPoint?: {x: number; y: number}
  format: string

  ogURL: string
  smallTeaserURL: string
  mediumTeaserURL: string
  largeURL: string
}

export interface Author {
  id: string
  url: string
  slug: string
  name: string
  image: ImageData
}

export interface NavigationItem {
  title: string
  route: Route
  isActive: boolean
}

export interface ArticleMeta {
  id: string
  url: string

  peer?: Peer
  authors?: Author[]
  tags: string[]

  publishedAt: Date
  updatedAt: Date

  preTitle?: string
  title: string
  lead: string
  image: any
  slug?: string
  isBreaking: boolean

  teaserType?: TeaserType
  teaserStyle?: TeaserStyle
}

export type PublishedArticle = ArticleMeta & {
  blocks: Block[]
}

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
  Page = 'page'
}

export enum TeaserStyle {
  Default = 'default',
  Light = 'light',
  Text = 'text',
  Breaking = 'breaking'
}

export interface Front {
  id: string
}

export interface Page {
  id: string
}

export interface Peer {
  id: string
  slug: string
  name: string
  logoURL: string
  websiteURL: string
  themeColor: string
}

export enum BlockType {
  Foo = 'foo',
  Bar = 'bar',

  // Content
  TitleImage = 'titleImage',
  Title = 'title',
  RichText = 'RichTextBlock',
  Gallery = 'gallery',
  Teaser = 'teaser',
  Embed = 'embed',
  Quote = 'quote',
  Image = 'image',
  Listicle = 'listicle',
  PeerPageBreak = 'linkPageBreak',

  // Layout
  Grid = 'grid'
}

export interface BaseBlock<T extends BlockType, V> {
  type: T
  key: string
  value: V
}

// Content Blocks
// --------------
export enum HeaderType {
  Default = 'default',
  Breaking = 'breaking'
}
export type TitleBlockValue = {
  type: HeaderType
  preTitle?: string
  date?: Date
  title: string
  lead: string
  isHeader?: boolean
}
export interface TitleBlock extends BaseBlock<BlockType.Title, TitleBlockValue> {}

export interface QuoteBlock extends BaseBlock<BlockType.Quote, {text: string; author: string}> {}

export interface ImageBlock extends BaseBlock<BlockType.Image, ImageData> {}
export interface TitleImageBlock extends BaseBlock<BlockType.TitleImage, ImageData> {}

export interface ListicleBlock
  extends BaseBlock<
    BlockType.Listicle,
    {
      title: string
      image: ImageData
      text: Node[]
    }[]
  > {}

export interface PeerPageBreakBlock
  extends BaseBlock<
    BlockType.PeerPageBreak,
    {
      peer: Peer
      text: string
      richText: RichTextBlockValue
      linkURL: string
      linkText: string
      linkTarget: string
      styleOption: string
      layoutOption: string
      imageID: string
      image: undefined
    }
  > {}

export interface RichTextBlock extends BaseBlock<BlockType.RichText, Node[]> {}

export type GalleryBlock = BaseBlock<
  BlockType.Gallery,
  {
    title: string
    media: any[]
  }
>

export type TeaserBlock = BaseBlock<BlockType.Teaser, PublishedArticle>

export enum EmbedType {
  FacebookPost = 'facebookPost',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  IFrame = 'iframe'
}

export interface FacebookPostEmbedData {
  type: EmbedType.FacebookPost
  userID: string
  postID: string
}

export interface InstagramPostEmbedData {
  type: EmbedType.InstagramPost
  postID: string
}

export interface TwitterTweetEmbedData {
  type: EmbedType.TwitterTweet
  userID: string
  tweetID: string
}

export interface VimeoVideoEmbedData {
  type: EmbedType.VimeoVideo
  videoID: string
}

export interface YouTubeVideoEmbedData {
  type: EmbedType.YouTubeVideo
  videoID: string
}

export interface SoundCloudTrackEmbedData {
  type: EmbedType.SoundCloudTrack
  trackID: string
}

export interface IFrameEmbed {
  type: EmbedType.IFrame
  title?: string
  url?: string
  width?: number
  height?: number
  styleCustom?: string
}

export type EmbedData =
  | FacebookPostEmbedData
  | InstagramPostEmbedData
  | TwitterTweetEmbedData
  | VimeoVideoEmbedData
  | YouTubeVideoEmbedData
  | SoundCloudTrackEmbedData
  | IFrameEmbed

export type EmbedBlock = BaseBlock<BlockType.Embed, EmbedData>

// Layout Blocks
// -------------

export type GridBlock = BaseBlock<
  BlockType.Grid,
  {
    numColumns: number
    blocks: Block[]
  }
>

// Block Unions
// ------------

export type Block =
  | RichTextBlock
  | GalleryBlock
  | EmbedBlock
  | ImageBlock
  | QuoteBlock
  | ListicleBlock
  | PeerPageBreakBlock
  | TitleBlock
  | TitleImageBlock
  | GridBlock
  | TeaserBlock

// Image
export interface ImageRefData {
  id: string

  filename?: string
  extension: string
  title?: string
  description?: string

  width: number
  height: number

  url: string
  largeURL: string
  mediumURL: string
  thumbURL: string

  column1URL: string
  column6URL: string
  previewURL: string
  squareURL: string
}

// Article Reference
export interface ArticleReference {
  id: string

  createdAt: string
  modifiedAt: string

  draft?: {revision: number}
  pending?: {revision: number}
  published?: {revision: number}

  latest: {
    revision: number
    publishAt?: string
    publishedAt?: string
    updatedAt?: string
    title?: string
    lead?: string
    image?: ImageRefData
  }
}

// Page Info
export interface PageInfo {
  readonly startCursor?: string
  readonly endCursor?: string
  readonly hasNextPage: boolean
  readonly hasPreviousPage: boolean
}
