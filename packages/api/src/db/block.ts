import {MapDiscriminatedUnion} from '@karma.run/utility'
import {RichTextNode} from '../graphql/richText'

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
  Embed = 'embed',
  Quote = 'quote',
  Image = 'image',
  ImageGallery = 'imageGallery',
  Listicle = 'listicle',
  LinkPageBreak = 'linkPageBreak',
  TeaserGrid = 'teaserGrid',
  CustomContent = 'customContent'
}

export interface RichTextBlock {
  type: BlockType.RichText
  richText: RichTextNode[]
}

export interface ImageBlock {
  type: BlockType.Image
  caption?: string
  imageID?: string
}

export interface ImageCaptionEdge {
  caption: string
  imageID: string
}

export interface ImageGalleryBlock {
  type: BlockType.ImageGallery
  images: ImageCaptionEdge[]
}

export interface FacebookPostBlock {
  type: BlockType.FacebookPost
  userID: string
  postID: string
}

export interface FacebookVideoBlock {
  type: BlockType.FacebookVideo
  userID: string
  videoID: string
}

export interface InstagramPostBlock {
  type: BlockType.InstagramPost
  postID: string
}

export interface TwitterTweetBlock {
  type: BlockType.TwitterTweet
  userID: string
  tweetID: string
}

export interface VimeoVideoBlock {
  type: BlockType.VimeoVideo
  videoID: string
}

export interface YouTubeVideoBlock {
  type: BlockType.YouTubeVideo
  videoID: string
}

export interface SoundCloudTrackBlock {
  type: BlockType.SoundCloudTrack
  trackID: string
}

export interface EmbedBlock {
  type: BlockType.Embed
  url?: string
  title?: string
  width?: number
  height?: number
}

export interface ListicleItem {
  title: string
  imageID?: string
  richText: RichTextNode[]
}

export interface ListicleBlock {
  type: BlockType.Listicle
  items: ListicleItem[]
}

export interface LinkPageBreakBlock {
  type: BlockType.LinkPageBreak
  text: string
  linkURL: string
  linkText: string
}

export interface TitleBlock {
  type: BlockType.Title
  title?: string
  lead?: string
}

export interface QuoteBlock {
  type: BlockType.Quote
  quote?: string
  author?: string
}

export enum TeaserType {
  Article = 'article',
  PeerArticle = 'peerArticle',
  Page = 'page',
  External = 'external'
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

export type Teaser = ArticleTeaser | PeerArticleTeaser | PageTeaser

export interface TeaserGridBlock {
  type: BlockType.TeaserGrid
  teasers: Teaser[]
  numColumns: number
}

enum CustomContentFormat {
  HTML = 'html',
  JSON = 'json',
  MARKDOWN = 'markdown',
  Other = 'other'
}

export interface CustomContentBlock {
  type: BlockType.CustomContent
  kind: string
  content: string
  format: CustomContentFormat
  width?: number
  height?: number
}

export type ArticleBlock =
  | RichTextBlock
  | ImageBlock
  | ImageGalleryBlock
  | TitleBlock
  | QuoteBlock
  | ListicleBlock
  | LinkPageBreakBlock
  | FacebookPostBlock
  | InstagramPostBlock
  | TwitterTweetBlock
  | VimeoVideoBlock
  | YouTubeVideoBlock
  | SoundCloudTrackBlock
  | TeaserGridBlock
  | CustomContentBlock

export type PageBlock = ArticleBlock
export type Block = ArticleBlock | PageBlock

export type BaseBlockMap = MapDiscriminatedUnion<Block, 'type'>
export type BlockMap = {[K in Block['type']]?: Omit<BaseBlockMap[K], 'type'>}
