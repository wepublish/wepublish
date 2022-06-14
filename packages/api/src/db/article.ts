import {MetadataProperty} from '@prisma/client'
import {ArticleBlock} from './block'

export interface ArticleData {
  readonly preTitle?: string | null
  readonly title?: string | null
  readonly lead?: string | null
  readonly seoTitle?: string | null
  readonly slug?: string | null
  readonly tags: string[]

  readonly canonicalUrl?: string | null

  readonly properties: MetadataProperty[]

  readonly imageID?: string | null
  readonly authorIDs: string[]

  readonly breaking: boolean
  readonly blocks: ArticleBlock[]

  readonly hideAuthor: boolean

  readonly socialMediaTitle?: string | null
  readonly socialMediaDescription?: string | null
  readonly socialMediaAuthorIDs: string[]
  readonly socialMediaImageID?: string | null
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
  readonly publishAt?: Date | null
  readonly updatedAt?: Date | null
  readonly publishedAt?: Date | null
}

export interface PublicArticle extends ArticleData {
  readonly id: string

  readonly shared: boolean
  readonly updatedAt?: Date | null
  readonly publishedAt?: Date | null

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

export interface GetArticleHistoryArgs {
  readonly id: string
}

export interface ArticleInput extends ArticleData {
  readonly shared: boolean
}

export interface UpdateArticleArgs {
  readonly id: string
  readonly input: ArticleInput
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
  updateArticle(args: UpdateArticleArgs): Promise<OptionalArticle>
  publishArticle(args: PublishArticleArgs): Promise<OptionalArticle>
  unpublishArticle(args: UnpublishArticleArgs): Promise<OptionalArticle>
}
