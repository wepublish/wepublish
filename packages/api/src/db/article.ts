import {ArticleBlock} from './block'
import {SortOrder, Limit, InputCursor, ConnectionResult, MetadataProperty} from './common'

export interface ArticleData {
  readonly preTitle?: string
  readonly title: string
  readonly lead?: string
  readonly slug: string
  readonly tags: string[]

  readonly properties: MetadataProperty[]

  readonly imageID?: string
  readonly authorIDs: string[]

  readonly breaking: boolean
  readonly blocks: ArticleBlock[]
}

// Article State Flow:
// Draft -> Pending (Optional) -> Published -> History
export interface Article {
  readonly id: string

  readonly shared: boolean
  readonly createdAt: Date
  readonly modifiedAt: Date

  readonly draft: ArticleRevision | null
  readonly published: ArticleRevision | null
  readonly pending: ArticleRevision | null
}

export interface PeerArticle {
  peerID: string
  article: any
}

export interface ArticleHistory {
  readonly id: string
  readonly revisions: ArticleRevision[]
}

export interface ArticleRevision extends ArticleData {
  readonly revision: number

  readonly createdAt: Date
  readonly publishAt?: Date
  readonly updatedAt?: Date
  readonly publishedAt?: Date
}

export interface PublicArticle extends ArticleData {
  readonly id: string

  readonly shared: boolean
  readonly updatedAt: Date
  readonly publishedAt: Date

  readonly blocks: ArticleBlock[]
}

export interface ArticleFilter {
  readonly title?: string
  readonly draft?: boolean
  readonly published?: boolean
  readonly pending?: boolean
  readonly shared?: boolean
  readonly authors?: string[]
  readonly tags?: string[]
}

export interface PublicArticleFilter {
  readonly authors?: string[]
  readonly tags?: string[]
}

export enum ArticleSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  PublishedAt = 'publishedAt',
  UpdatedAt = 'updatedAt',
  PublishAt = 'publishAt'
}

export interface GetArticlesArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: ArticleFilter
  readonly sort: ArticleSort
  readonly order: SortOrder
}

export interface GetPublishedArticlesArgs {
  readonly cursor: InputCursor
  readonly limit: Limit
  readonly filter?: PublicArticleFilter
  readonly sort: ArticleSort
  readonly order: SortOrder
}

export interface GetArticleHistoryArgs {
  readonly id: string
}

export interface ArticleInput extends ArticleData {
  readonly shared: boolean
}

export interface CreateArticleArgs {
  readonly input: ArticleInput
}

export interface UpdateArticleArgs {
  readonly id: string
  readonly input: ArticleInput
}

export interface DeleteArticleArgs {
  readonly id: string
}

export interface UnpublishArticleArgs {
  readonly id: string
}

export interface PublishArticleArgs {
  readonly id: string
  readonly publishAt?: Date
  readonly publishedAt?: Date
  readonly updatedAt?: Date
}

export type OptionalArticle = Article | null
export type OptionalPublicArticle = PublicArticle | null
export type OptionalArticleHistory = ArticleHistory | null

export interface DBArticleAdapter {
  createArticle(args: CreateArticleArgs): Promise<Article>
  updateArticle(args: UpdateArticleArgs): Promise<OptionalArticle>
  publishArticle(args: PublishArticleArgs): Promise<OptionalArticle>
  unpublishArticle(args: UnpublishArticleArgs): Promise<OptionalArticle>
  deleteArticle(args: DeleteArticleArgs): Promise<boolean | null>

  getArticlesByID(ids: readonly string[]): Promise<OptionalArticle[]>
  getPublishedArticlesByID(ids: readonly string[]): Promise<OptionalPublicArticle[]>

  getArticles(args: GetArticlesArgs): Promise<ConnectionResult<Article>>
  getPublishedArticles(args: GetPublishedArticlesArgs): Promise<ConnectionResult<PublicArticle>>

  // TODO: Implement article history
  // getArticleHistory(args: GetArticleHistoryArgs): Promise<OptionalArticleHistory>
}
