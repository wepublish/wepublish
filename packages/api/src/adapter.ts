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

export interface AdapterImageEdge {
  readonly description: string
  readonly imageID: string
}

export interface AdapterImageBlock extends AdapterBaseBlock {
  readonly type: BlockType.Image
  readonly image: AdapterImageEdge
}

export interface AdapterImageGalleryBlock extends AdapterBaseBlock {
  readonly type: BlockType.ImageGallery
  readonly images: AdapterImageEdge[]
}

export interface FacebookPostBlock extends AdapterBaseBlock {
  readonly type: BlockType.FacebookPost
  readonly userID: string
  readonly postID: string
}

export interface InstagramPostBlock extends AdapterBaseBlock {
  readonly type: BlockType.InstagramPost
  readonly postID: string
}

export interface TwitterTweetBlock extends AdapterBaseBlock {
  readonly type: BlockType.TwitterTweet
  readonly userID: string
  readonly tweetID: string
}

export interface VimeoVideoBlock extends AdapterBaseBlock {
  readonly type: BlockType.VimeoVideo
  readonly videoID: string
}

export interface YouTubeVideoBlock extends AdapterBaseBlock {
  readonly type: BlockType.YouTubeVideo
  readonly videoID: string
}

export interface SoundCloudTrackBlock extends AdapterBaseBlock {
  readonly type: BlockType.SoundCloudTrack
  readonly trackID: string
}

export interface ListicleItem {
  readonly title: string
  readonly imageID?: string
  readonly richText: DocumentJSON
}

export interface ListicleBlock extends AdapterBaseBlock {
  readonly type: BlockType.Listicle
  readonly listicle: ListicleItem[]
}

export interface LinkPageBreakBlock extends AdapterBaseBlock {
  readonly type: BlockType.LinkPageBreak
  readonly text: string
  readonly linkURL: string
  readonly linkText: string
}

export interface TitleBlock extends AdapterBaseBlock {
  readonly type: BlockType.Title
  readonly title: string
  readonly subtitle: string
}

export interface QuoteBlock extends AdapterBaseBlock {
  readonly type: BlockType.Quote
  readonly text: string
  readonly author?: string
}

export interface AdapterArticleEdge {
  readonly articleID: string
}

export interface AdapterArticleGridBlock extends AdapterBaseBlock {
  readonly type: BlockType.ArticleGrid
  readonly articles: AdapterArticleEdge[]
  readonly numColumns: number
}

export interface BlockMap {
  [BlockType.RichText]?: Omit<AdapterRichTextBlock, 'type'>
  [BlockType.Image]?: AdapterImageBlock
}

export type AdapterArticleBlock =
  | AdapterRichTextBlock
  | AdapterImageBlock
  | AdapterImageGalleryBlock
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

  readonly preTitle?: string
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

  getArticleVersionFeaturedBlock(id: string, version: number): Promise<AdapterArticleBlock | null>
  getArticleVersionBlocks(id: string, version: number): Promise<AdapterArticleBlock[]>

  // Image
  createImage(image: AdapterImage): Promise<AdapterImage>
  getImage(id: string): Promise<AdapterImage | null>

  // Peers
  createPeer(id: string, args: any): Promise<AdapterPeer>

  getPeer(args: PeerArguments): Promise<AdapterPeer | undefined>
  getPeers(args: PeersArguments): Promise<AdapterPeer[]>
}
