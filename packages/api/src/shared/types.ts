import {ValueJSON} from 'slate'

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

  createdAt: Date
  updatedAt: Date
  publishedAt?: Date

  published?: ArticleVersion
  draft?: ArticleVersion

  versions: ArticleVersion[]
}

export interface ArticleVersion {
  version: number
  state: ArticleVersionState

  createdAt: Date
  updatedAt: Date

  title: string
  lead: string

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

  // Layout
  GridBlock = 'gridBlock'
}

export interface RichTextBlock {
  type: BlockType.RichText
  value: ValueJSON
}

export interface GalleryBlock {
  type: BlockType.Gallery
  value: {
    title: string
    media: any[]
  }
}

export interface GridBlock {
  type: BlockType.GridBlock
  value: {
    numRows: number
    numColumns: number
    blocks: FrontContentBlock
  }
}

export interface TeaserBlock {
  type: BlockType.Teaser
  value: {
    article: Article
  }
}

export type ArticleBlock = RichTextBlock | GalleryBlock

export type FrontLayoutBlock = GridBlock
export type FrontContentBlock = GalleryBlock
