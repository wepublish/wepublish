import {ArticleVersionState, BlockType} from './types'
import {DocumentJSON} from 'slate'

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

export interface AdapterPeer {
  readonly id: string
  readonly name: string
  readonly url: string
}

export interface AdapterBaseBlock {
  readonly key: string
}

export interface AdapterRichTextBlock extends AdapterBaseBlock {
  readonly type: BlockType.RichText
  readonly richText: DocumentJSON
}

export interface AdapterImageBlock extends AdapterBaseBlock {
  readonly type: BlockType.Image
  readonly imageID: string
}

export interface AdapterArticleGridBlock extends AdapterBaseBlock {
  readonly type: BlockType.ArticleGrid
  readonly articleIDs: string[]
  readonly numColumns: number
}

export interface BlockMap {
  [BlockType.RichText]?: Omit<AdapterRichTextBlock, 'type'>
  [BlockType.Image]?: AdapterImageBlock
}

export type AdapterArticleBlock = AdapterRichTextBlock | AdapterImageBlock
export type AdapterPageBlock = AdapterRichTextBlock | AdapterImageBlock | AdapterArticleGridBlock

export interface AdapterArticleInput {
  readonly id: string
  readonly state: ArticleVersionState

  readonly title: string
  readonly lead: string
  readonly slug: string

  readonly publishDate?: Date

  readonly featuredBlock: AdapterArticleBlock
  readonly blocks: AdapterArticleBlock[]
}

export interface AdapterPageInput {
  readonly id: string
  readonly state: ArticleVersionState

  readonly title: string
  readonly description: string
  readonly slug: string

  readonly publishDate?: Date

  readonly blocks: AdapterPageBlock[]
}

export interface AdapterPage {
  readonly id: string

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly publishedAt?: Date

  readonly publishedVersion?: number
  readonly draftVersion?: number
}

export interface AdapterPageVersion {
  readonly articleID: string

  readonly version: number
  readonly state: ArticleVersionState

  readonly createdAt: Date
  readonly updatedAt: Date

  readonly title: string
  readonly description: string
  readonly slug: string
}

export interface AdapterArticle {
  readonly id: string
  readonly peer?: AdapterPeer

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly publishedAt?: Date

  readonly publishedVersion?: number
  readonly draftVersion?: number
}

export interface AdapterArticleVersion {
  readonly articleID: string

  readonly version: number
  readonly state: ArticleVersionState

  readonly createdAt: Date
  readonly updatedAt: Date

  readonly title: string
  readonly lead: string
  readonly slug: string
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
  createPeer(id: string, args: any): Promise<AdapterPeer>

  getPeer(args: PeerArguments): Promise<AdapterPeer | undefined>
  getPeers(args: PeersArguments): Promise<AdapterPeer[]>
}
