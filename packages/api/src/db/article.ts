import {ArticleBlock} from './block'

export interface Article {
  readonly id: string
  readonly createdAt: Date
  readonly updatedAt: Date
}

export interface CommonArticleMetadata {
  readonly preTitle?: string
  readonly title: string
  readonly lead: string
  readonly slug: string
  readonly tags: string[]

  readonly imageID?: string
  readonly authorIDs: string[]

  readonly shared: boolean
  readonly breaking: boolean
}

export interface ArticleVersion {
  readonly id: string
  readonly version: number

  readonly createdAt: Date
  readonly updatedAt: Date
  readonly publishedAt: Date
}

export interface PublishedArticle extends CommonArticleMetadata {
  readonly id: string
  readonly peerID?: string

  readonly updatedAt: Date
  readonly publishedAt: Date

  readonly blocks: ArticleBlock[]
}

export interface ArticleFilter {}
export interface ArticleSort {}

export interface GetArticlesArgs {
  readonly cursor?: string
  readonly filter?: ArticleFilter
  readonly sort?: ArticleSort
  readonly limit?: number
}

export interface CreateArticleArgs extends CommonArticleMetadata {
  readonly blocks: ArticleBlock[]
}

export interface CreateArticleVersionArgs extends CommonArticleMetadata {}

export interface UpdateArticleVersionArgs extends CommonArticleMetadata {
  readonly id: string
  readonly version: string
  readonly blocks: ArticleBlock[]
}

export interface PublishArticleArgs extends CommonArticleMetadata {
  readonly id: string
  readonly version: string
  readonly publishedAt: Date
  readonly updatedAt: Date
}

export interface DBArticleAdapter {
  createArticle(args: CreateArticleArgs): Promise<Article>

  createArticleVersion(args: CreateArticleVersionArgs): Promise<Article>
  updateArticleVersion(args: UpdateArticleVersionArgs): Promise<Article>
  publishArticleVersion(args: PublishArticleArgs): Promise<Article>

  getPublishedArticles(args: GetArticlesArgs): void
  getPublishedArticle(args: GetArticlesArgs): void

  getArticles(args: GetArticlesArgs): void
  getArticle(args: GetArticlesArgs): void
}
