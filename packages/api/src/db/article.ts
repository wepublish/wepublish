import {ArticleBlock} from './block'
import {PageInfo} from '../adapter/pageInfo'

// export interface Article {
//   readonly id: string
//   readonly createdAt: Date
//   readonly updatedAt: Date
// }

export interface CommonArticleData {
  readonly updatedAt: Date
  readonly publishedAt: Date

  readonly preTitle?: string
  readonly title: string
  readonly lead: string
  readonly slug: string
  readonly tags: string[]

  readonly imageID?: string
  readonly authorIDs: string[]

  readonly shared: boolean
  readonly breaking: boolean

  readonly blocks: ArticleBlock[]
}

export interface Article extends CommonArticleData {
  readonly id: string
}

export interface ArticleVersion {
  readonly id: string
  readonly revision: number

  readonly createdAt: Date
  readonly modifiedAt: Date
  readonly publishAt?: Date

  readonly article: Article
}

export interface PublishedArticle extends CommonArticleData {
  readonly id: string
  readonly peerID?: string

  readonly updatedAt: Date
  readonly publishedAt: Date

  readonly blocks: ArticleBlock[]
}

export interface ArticleFilter {}
export interface ArticleSort {}

export interface GetArticlesArgs {
  readonly after?: string
  readonly before?: string
  readonly first?: number
  readonly last?: number
  readonly filter?: ArticleFilter
  readonly sort?: ArticleSort
}

export interface CreateArticleArgs {
  readonly input: CommonArticleData
}

export interface CreateArticleVersionArgs extends CommonArticleData {}

export interface UpdateArticleVersionArgs extends CommonArticleData {
  readonly id: string
  readonly version: string
  readonly blocks: ArticleBlock[]
}

export interface PublishArticleArgs extends CommonArticleData {
  readonly id: string
  readonly version: string
  readonly publishedAt: Date
  readonly updatedAt: Date
}

export interface ArticlesResult {
  readonly nodes: Article[]
  readonly pageInfo: PageInfo
  readonly totalCount: number
}

export interface DBArticleAdapter {
  createArticle(args: CreateArticleArgs): Promise<ArticleVersion>

  createArticleVersion(args: CreateArticleVersionArgs): Promise<Article>
  updateArticleVersion(args: UpdateArticleVersionArgs): Promise<Article>
  publishArticleVersion(args: PublishArticleArgs): Promise<Article>

  getPublishedArticles(args: GetArticlesArgs): Promise<ArticlesResult>
  getPublishedArticle(args: GetArticlesArgs): void

  getArticles(args: GetArticlesArgs): void
  getArticle(args: GetArticlesArgs): void
}
