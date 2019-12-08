import {MapDiscriminatedUnion} from '@karma.run/utility'

import {ImageCaptionEdge} from './image'
import {ArticleTeaser} from './article'

export enum BlockType {
  Title = 'title',
  RichText = 'richText',
  FacebookPost = 'facebookPost',
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
  ArticleTeaserGrid = 'articleTeaserGrid'
}

export interface BaseBlock {}

export enum BlockFormat {
  H1 = 'heading-one',
  H2 = 'heading-two',
  H3 = 'heading-three',
  Paragraph = 'paragraph',
  UnorderedList = 'unordered-list',
  OrderedList = 'ordered-list',
  ListItem = 'list-item'
}

export enum InlineFormat {
  Link = 'link'
}

export enum TextFormat {
  Bold = 'bold',
  Italic = 'italic',
  Underline = 'underline',
  Strikethrough = 'strikethrough'
}

export interface RichTextBlockNode {
  readonly type: BlockFormat
  readonly children: RichTextValue
}

export interface RichTextLinkNode {
  readonly type: InlineFormat.Link
  readonly url: string
  readonly title?: string
  readonly children: RichTextValue
}

export interface RichTextTextNode {
  readonly [TextFormat.Bold]?: boolean
  readonly [TextFormat.Italic]?: boolean
  readonly [TextFormat.Underline]?: boolean
  readonly [TextFormat.Strikethrough]?: boolean
  readonly text: string
}

export type RichTextValue = RichTextBlockNode | RichTextLinkNode | RichTextTextNode

export interface RichTextBlock extends BaseBlock {
  readonly type: BlockType.RichText
  readonly richText: RichTextValue
}

export interface ImageBlock extends BaseBlock {
  readonly type: BlockType.Image
  readonly caption?: string
  readonly imageID?: string
}

export interface ImageGalleryBlock extends BaseBlock {
  readonly type: BlockType.ImageGallery
  readonly images: ImageCaptionEdge[]
}

export interface FacebookPostBlock extends BaseBlock {
  readonly type: BlockType.FacebookPost
  readonly userID: string
  readonly postID: string
}

export interface InstagramPostBlock extends BaseBlock {
  readonly type: BlockType.InstagramPost
  readonly postID: string
}

export interface TwitterTweetBlock extends BaseBlock {
  readonly type: BlockType.TwitterTweet
  readonly userID: string
  readonly tweetID: string
}

export interface VimeoVideoBlock extends BaseBlock {
  readonly type: BlockType.VimeoVideo
  readonly videoID: string
}

export interface YouTubeVideoBlock extends BaseBlock {
  readonly type: BlockType.YouTubeVideo
  readonly videoID: string
}

export interface SoundCloudTrackBlock extends BaseBlock {
  readonly type: BlockType.SoundCloudTrack
  readonly trackID: string
}

export interface EmbedBlock extends BaseBlock {
  readonly type: BlockType.Embed
  readonly url?: string
  readonly title?: string
  readonly width?: number
  readonly height?: number
}

export interface ListicleItem {
  readonly title: string
  readonly imageID?: string
  readonly richText: RichTextValue
}

export interface ListicleBlock extends BaseBlock {
  readonly type: BlockType.Listicle
  readonly listicle: ListicleItem[]
}

export interface LinkPageBreakBlock extends BaseBlock {
  readonly type: BlockType.LinkPageBreak
  readonly text: string
  readonly linkURL: string
  readonly linkText: string
}

export interface TitleBlock extends BaseBlock {
  readonly type: BlockType.Title
  readonly title?: string
  readonly lead?: string
}

export interface QuoteBlock extends BaseBlock {
  readonly type: BlockType.Quote
  readonly quote?: string
  readonly author?: string
}

export interface ArticleTeaserGridBlock extends BaseBlock {
  readonly type: BlockType.ArticleTeaserGrid
  readonly teasers: ArticleTeaser[]
  readonly numColumns: number
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

export type PageBlock = RichTextBlock | ImageBlock | ArticleTeaserGridBlock

export type BaseBlockMap = MapDiscriminatedUnion<ArticleBlock, 'type'>
export type BlockMap = {[K in ArticleBlock['type']]?: Omit<BaseBlockMap[K], 'type'>}
