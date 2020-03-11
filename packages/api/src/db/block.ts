import {MapDiscriminatedUnion} from '@karma.run/utility'
import {RichTextNode} from '../graphql/richText'

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

export interface RichTextBlock {
  readonly type: BlockType.RichText
  readonly richText: RichTextNode[]
}

export interface ImageBlock {
  readonly type: BlockType.Image
  readonly caption?: string
  readonly imageID?: string
}

export interface ImageCaptionEdge {
  readonly caption: string
  readonly imageID: string
}

export interface ImageGalleryBlock {
  readonly type: BlockType.ImageGallery
  readonly images: ImageCaptionEdge[]
}

export interface FacebookPostBlock {
  readonly type: BlockType.FacebookPost
  readonly userID: string
  readonly postID: string
}

export interface InstagramPostBlock {
  readonly type: BlockType.InstagramPost
  readonly postID: string
}

export interface TwitterTweetBlock {
  readonly type: BlockType.TwitterTweet
  readonly userID: string
  readonly tweetID: string
}

export interface VimeoVideoBlock {
  readonly type: BlockType.VimeoVideo
  readonly videoID: string
}

export interface YouTubeVideoBlock {
  readonly type: BlockType.YouTubeVideo
  readonly videoID: string
}

export interface SoundCloudTrackBlock {
  readonly type: BlockType.SoundCloudTrack
  readonly trackID: string
}

export interface EmbedBlock {
  readonly type: BlockType.Embed
  readonly url?: string
  readonly title?: string
  readonly width?: number
  readonly height?: number
}

export interface ListicleItem {
  readonly title: string
  readonly imageID?: string
  readonly richText: RichTextNode[]
}

export interface ListicleBlock {
  readonly type: BlockType.Listicle
  readonly listicle: ListicleItem[]
}

export interface LinkPageBreakBlock {
  readonly type: BlockType.LinkPageBreak
  readonly text: string
  readonly linkURL: string
  readonly linkText: string
}

export interface TitleBlock {
  readonly type: BlockType.Title
  readonly title?: string
  readonly lead?: string
}

export interface QuoteBlock {
  readonly type: BlockType.Quote
  readonly quote?: string
  readonly author?: string
}

export interface ArticleTeaser {
  readonly type?: string
  readonly articleID: string
}

export interface ArticleTeaserGridBlock {
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
export type Block = ArticleBlock | PageBlock

export type BaseBlockMap = MapDiscriminatedUnion<Block, 'type'>
export type BlockMap = {[K in Block['type']]?: Omit<BaseBlockMap[K], 'type'>}
