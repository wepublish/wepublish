import {ArticleBlock} from './block'
import {PageInfo} from '../adapter/pageInfo'
import {Limit, InputCursor} from './pagination'
import {SortOrder} from './common'

export interface ArticleData {
  readonly updatedAt?: Date
  readonly publishedAt?: Date

  readonly preTitle?: string
  readonly title: string
  readonly lead?: string
  readonly slug: string
  readonly tags: string[]

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

export interface ArticleHistory {
  readonly id: string
  readonly revisions: ArticleRevision[]
}

export interface ArticleRevision extends ArticleData {
  readonly revision: number

  readonly createdAt: Date
  readonly publishAt?: Date
}

export interface PublishedArticle extends ArticleData {
  readonly id: string

  readonly updatedAt: Date
  readonly publishedAt: Date

  readonly blocks: ArticleBlock[]
}

export interface ArticleFilter {
  readonly title?: string
  readonly draft?: boolean
  readonly published?: boolean
  readonly pending?: boolean
  readonly authors?: string[]
  readonly tags?: string[]
}

export interface PublishedArticleFilter {
  readonly title?: string
  readonly authors?: string[]
  readonly tags?: string[]
}

export enum ArticleSort {
  CreatedAt = 'modifiedAt',
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
  readonly filter?: PublishedArticleFilter
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

export interface PublishArticleArgs {
  readonly id: string
  readonly publishAt?: Date
  readonly publishedAt?: Date
  readonly updatedAt?: Date
}

export interface ArticlesResult {
  readonly nodes: Article[]
  readonly pageInfo: PageInfo
  readonly totalCount: number
}

export interface PublishedArticleResult {
  readonly nodes: PublishedArticle[]
  readonly pageInfo: PageInfo
  readonly totalCount: number
}

export type OptionalArticle = Article | null
export type OptionalPublishedArticle = PublishedArticle | null
export type OptionalArticleHistory = ArticleHistory | null

export interface DBArticleAdapter {
  createArticle(args: CreateArticleArgs): Promise<Article>
  updateArticle(args: UpdateArticleArgs): Promise<OptionalArticle>
  publishArticle(args: PublishArticleArgs): Promise<OptionalArticle>
  unpublishArticle(id: string): Promise<OptionalArticle>
  deleteArticle(id: string): Promise<boolean | null>

  getArticlesByID(args: readonly string[]): Promise<OptionalArticle[]>
  getPublishedArticlesByID(args: readonly string[]): Promise<OptionalPublishedArticle[]>

  getArticles(args: GetArticlesArgs): Promise<ArticlesResult>
  getPublishedArticles(args: GetPublishedArticlesArgs): Promise<PublishedArticleResult>

  getArticleHistory(args: GetArticleHistoryArgs): Promise<OptionalArticleHistory>
}
