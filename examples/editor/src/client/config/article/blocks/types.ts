import {BlockListValue} from '../atoms/blockList'
import {ListValue} from '../atoms/listInput'
import {ImageRefFragment, TeaserStyle} from '../api'
import {Reference, RichTextBlockValue} from '@wepublish/editor'
import {
  ArticleRefFragment,
  PageRefFragment,
  PeerRefFragment
} from '@wepublish/editor/lib/client/api'

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
  TeaserGrid6 = 'teaserGrid6'
}

export interface RichTextBlockExampleValue {
  richText: RichTextBlockValue
}

export interface ImageBlockValue {
  image: Reference | null
  caption: string
}

export interface GalleryImageEdge {
  image: Reference | null
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
  image?: Reference | undefined
}

export enum EmbedType {
  FacebookPost = 'facebookPost',
  FacebookVideo = 'facebookVideo',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  Other = 'other'
}

export interface FacebookPostEmbed {
  type: EmbedType.FacebookPost
  userID: string
  postID: string
}

export interface FacebookVideoEmbed {
  type: EmbedType.FacebookVideo
  userID: string
  videoID: string
}

export interface InstagramPostEmbed {
  type: EmbedType.InstagramPost
  postID: string
}

export interface TwitterTweetEmbed {
  type: EmbedType.TwitterTweet
  userID: string
  tweetID: string
}

export interface VimeoVideoEmbed {
  type: EmbedType.VimeoVideo
  videoID: string
}

export interface YouTubeVideoEmbed {
  type: EmbedType.YouTubeVideo
  videoID: string
}

export interface SoundCloudTrackEmbed {
  type: EmbedType.SoundCloudTrack
  trackID: string
}

export interface OtherEmbed {
  type: EmbedType.Other
  url?: string
  title?: string
  width?: number
  height?: number
  styleCustom?: string
}

export type EmbedBlockValue =
  | FacebookPostEmbed
  | FacebookVideoEmbed
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

export enum MetaDataType {
  General = 'general',
  SocialMedia = 'socialMedia'
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
  teasers: Array<[string, Teaser | null]>
  numColumns: number
}

export type RichTextBlockListValue = BlockListValue<BlockType.RichText, RichTextBlockExampleValue>
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
