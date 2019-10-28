import {ArticleVersionState, BlockType} from './types'

export interface DateRange {
  start: Date
  end: Date
}

export interface ArticleArguments {
  peer?: string
  id?: string
}

export interface ArticlesArguments {
  limit: number

  publishedBetween: DateRange
  updatedBetween: DateRange
  createdBetween: DateRange

  tagsInclude: string[]
  includePeers: boolean
}

export interface PeerArguments {
  id?: string
}

export interface PeersArguments {}

export interface ArticleVersion {
  title: string
  lead: string
  publishedDate: Date
}

export interface Peer {
  id: string
  name: string
  url: string
}

export interface RichTextBlock {
  foo: string
}

export interface ImageBlock {
  imageID: string
}

export interface BlockMap {
  [BlockType.RichText]?: RichTextBlock
  [BlockType.Image]?: ImageBlock
}

export type AdapterArticleBlock =
  | ({type: BlockType.RichText} & RichTextBlock)
  | ({type: BlockType.Image} & ImageBlock)

export type AdapterPageBlock =
  | ({type: BlockType.RichText} & RichTextBlock)
  | ({type: BlockType.Image} & ImageBlock)

export interface AdapterArticleInput {
  id: string
  state: ArticleVersionState

  title: string
  lead: string
  slug: string

  publishDate?: Date
  blocks: AdapterArticleBlock[]
}

export interface AdapterPageInput {
  id: string
  state: ArticleVersionState

  title: string
  description: string
  slug: string

  publishDate?: Date
  blocks: AdapterPageBlock[]
}

export interface AdapterPage {
  id: string

  createdAt: Date
  updatedAt: Date
  publishedAt?: Date

  publishedVersion?: number
  draftVersion?: number
}

export interface AdapterPageVersion {
  articleID: string

  version: number
  state: ArticleVersionState

  createdAt: Date
  updatedAt: Date

  title: string
  description: string
  slug: string
}

export interface AdapterArticle {
  id: string
  peer?: Peer

  createdAt: Date
  updatedAt: Date
  publishedAt?: Date

  publishedVersion?: number
  draftVersion?: number
}

export interface AdapterArticleVersion {
  articleID: string

  version: number
  state: ArticleVersionState

  createdAt: Date
  updatedAt: Date

  title: string
  lead: string
  slug: string
}

export interface AdapterUser {
  readonly id: string
  readonly email: string
}

export interface AdapterSession {
  readonly user: AdapterUser
  readonly token: string
  readonly expiresIn: number
}

export interface AdapterImage {
  readonly id: string
  readonly filename: string
  readonly fileSize: number
  readonly extension: string
  readonly mimeType: string
  readonly host: string
  readonly title: string
  readonly description: string
  readonly tags: string[]
  readonly url: string
  readonly width: number
  readonly height: number
}

export enum AdapterNavigationLinkType {
  Page = 'PageNavigationLink',
  Article = 'ArticleNavigationLink',
  External = 'ExternalNavigationLink'
}

export interface AdapterBaseNavigationLink {
  readonly label: string
}

export interface AdapterArticleNavigationLink extends AdapterBaseNavigationLink {
  readonly type: AdapterNavigationLinkType.Article
  readonly articleID: string
}

export interface AdapterPageNavigationLink extends AdapterBaseNavigationLink {
  readonly type: AdapterNavigationLinkType.Page
  readonly pageID: string
}

export interface AdapterExternalNavigationLink extends AdapterBaseNavigationLink {
  readonly type: AdapterNavigationLinkType.External
  readonly url: string
}

export type AdapterNavigationLink =
  | AdapterPageNavigationLink
  | AdapterArticleNavigationLink
  | AdapterExternalNavigationLink

export interface AdapterNavigation {
  readonly key: string
  readonly name: string
  readonly links: AdapterNavigationLink[]
}

export interface Adapter {
  // User
  getUserForCredentials(email: string, password: string): Promise<AdapterUser | null>

  // Session
  createSession(user: AdapterUser, token: string, expiryDate: Date): Promise<void>
  revokeSession(user: AdapterUser, token: string): Promise<void>
  getSessionUser(token: string): Promise<AdapterUser>

  // Navigation
  createNavigation(navigation: AdapterNavigation): Promise<AdapterNavigation>
  getNavigation(key: string): Promise<AdapterNavigation | null>

  // Page
  createPage(article: AdapterPageInput): Promise<AdapterPage>
  getPage(id: string): Promise<AdapterPage | null>
  getPageBySlug(slug: string): Promise<AdapterPage | null>

  getPageVersion(id: string, version: number): Promise<AdapterPageVersion | null>
  getPageVersions(id: string): Promise<AdapterPageVersion[]>
  getPageVersionBlocks(id: string, version: number): Promise<AdapterPageBlock[]>

  // Articles
  createArticle(article: AdapterArticleInput): Promise<AdapterArticle>

  getArticles(args: ArticlesArguments): Promise<AdapterArticle[]>
  getArticle(id: string): Promise<AdapterArticle | null>

  getArticleVersion(id: string, version: number): Promise<AdapterArticleVersion | null>
  getArticleVersions(id: string): Promise<AdapterArticleVersion[]>
  getArticleVersionBlocks(id: string, version: number): Promise<AdapterArticleBlock[]>

  // Image
  createImage(image: AdapterImage): Promise<AdapterImage>
  getImage(id: string): Promise<AdapterImage | null>

  // Peers
  createPeer(id: string, args: any): Promise<Peer>

  getPeer(args: PeerArguments): Promise<Peer | undefined>
  getPeers(args: PeersArguments): Promise<Peer[]>
}
