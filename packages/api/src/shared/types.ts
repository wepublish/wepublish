import {DocumentJSON} from 'slate'

export enum ArticleVersionState {
  Draft = 'draft',
  DraftReview = 'draftReview',
  Published = 'publish'
}

export enum NavigationLinkType {
  Article = 'article',
  Front = 'front',
  Page = 'page',
  External = 'external'
}

export interface ArticleNavigationLink {
  type: NavigationLinkType.Article
  value: Article
}

export interface FrontNavigationLink {
  type: NavigationLinkType.Front
  value: Front
}

export interface PageNavigationLink {
  type: NavigationLinkType.Page
  value: Page
}

export interface ExternalNavigationLink {
  type: NavigationLinkType.External
  value: string
}

export interface Navigation {
  [key: string]:
    | ArticleNavigationLink
    | FrontNavigationLink
    | PageNavigationLink
    | ExternalNavigationLink
}

export interface Article {
  id: string
  peer?: Peer

  createdAt: string
  updatedAt: string
  publishedAt?: string

  published?: ArticleVersion
  draft?: ArticleVersion

  versions: ArticleVersion[]
}

export interface PublishedArticle {
  id: string
  peer?: Peer

  createdAt: string
  updatedAt: string
  publishedAt: string

  published: ArticleVersion
}

export interface ArticleVersion {
  version: number
  state: ArticleVersionState

  createdAt: string
  updatedAt: string

  title: string
  lead: string
  image: any
  slug: string

  blocks: ArticleBlock[]
}

export interface Front {
  id: string
}

export interface Page {
  id: string
}

export interface Peer {
  id: string
  name: string
  url: string
}

export enum BlockType {
  // Content
  RichText = 'richText',
  Gallery = 'gallery',
  Teaser = 'teaser',
  Embed = 'embed',

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

export interface RichTextBlock extends BaseBlock<BlockType.RichText, DocumentJSON> {}

export type GalleryBlock = BaseBlock<
  BlockType.Gallery,
  {
    title: string
    media: any[]
  }
>

export type TeaserBlock = BaseBlock<BlockType.Teaser, Article>

export enum EmbedType {
  FacebookPost = 'facebookPost',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack'
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

export type EmbedData =
  | FacebookPostEmbedData
  | InstagramPostEmbedData
  | TwitterTweetEmbedData
  | VimeoVideoEmbedData
  | YouTubeVideoEmbedData
  | SoundCloudTrackEmbedData

export type EmbedBlock = BaseBlock<BlockType.Embed, EmbedData>

// Layout Blocks
// -------------

export type GridBlock = BaseBlock<
  BlockType.Grid,
  {
    numColumns: number
    blocks: FrontContentBlock
  }
>

// Block Unions
// ------------

export type ArticleBlock = RichTextBlock | GalleryBlock | EmbedBlock

export type FrontLayoutBlock = GridBlock
export type FrontContentBlock = TeaserBlock | GalleryBlock

export type Block = GridBlock | RichTextBlock | GalleryBlock | EmbedBlock | TeaserBlock
