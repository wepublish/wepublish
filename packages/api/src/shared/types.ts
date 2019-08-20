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

  // Layout
  GridBlock = 'gridBlock'
}

export interface Block<T extends BlockType, V> {
  type: T
  key: string
  value: V
}

export type RichTextBlock = Block<BlockType.RichText, DocumentJSON>

export type GalleryBlock = Block<
  BlockType.Gallery,
  {
    title: string
    media: any[]
  }
>

export type GridBlock = Block<
  BlockType.GridBlock,
  {
    numColumns: number
    blocks: FrontContentBlock
  }
>

export type TeaserBlock = Block<BlockType.Teaser, Article>

export type ArticleBlock = RichTextBlock | GalleryBlock

export type FrontLayoutBlock = GridBlock
export type FrontContentBlock = TeaserBlock | GalleryBlock
