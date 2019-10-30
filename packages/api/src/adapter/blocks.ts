import {RichTextValue} from '@karma.run/graphql'
import {MapDiscriminatedUnion} from '@karma.run/utility'

import {ArticleEdge} from './article'
import {ImageEdge} from './image'

export enum BlockType {
  Title = 'title',
  RichText = 'richText',
  FacebookPost = 'facebookPost',
  InstagramPost = 'instagramPost',
  TwitterTweet = 'twitterTweet',
  VimeoVideo = 'vimeoVideo',
  YouTubeVideo = 'youTubeVideo',
  SoundCloudTrack = 'soundCloudTrack',
  Quote = 'quote',
  Image = 'image',
  ImageGallery = 'imageGallery',
  Listicle = 'listicle',
  LinkPageBreak = 'linkPageBreak',
  ArticleGrid = 'articleGrid'
}

export interface BaseBlock {
  readonly key: string
}

export interface RichTextBlock extends BaseBlock {
  readonly type: BlockType.RichText
  readonly richText: RichTextValue
}

export interface ImageBlock extends BaseBlock {
  readonly type: BlockType.Image
  readonly image: ImageEdge
}

export interface ImageGalleryBlock extends BaseBlock {
  readonly type: BlockType.ImageGallery
  readonly images: ImageEdge[]
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
  readonly title: string
  readonly subtitle: string
}

export interface QuoteBlock extends BaseBlock {
  readonly type: BlockType.Quote
  readonly text: string
  readonly author?: string
}

export interface ArticleGridBlock extends BaseBlock {
  readonly type: BlockType.ArticleGrid
  readonly articles: ArticleEdge[]
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

export type PageBlock = RichTextBlock | ImageBlock | ArticleGridBlock

export type BaseBlockMap = MapDiscriminatedUnion<ArticleBlock, 'type'>
export type BlockMap = {[K in ArticleBlock['type']]?: Omit<BaseBlockMap[K], 'type'>}
