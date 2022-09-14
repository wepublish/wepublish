import {
  MetadataProperty,
  Article as PrismaArticle,
  ArticleRevision as PrismaArticleRevision
} from '@prisma/client'
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
  readonly peerInformation?: ArticlePeerInformation | null
}

// Article State Flow:
// Draft -> Pending (Optional) -> Published
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

export interface ArticlePeerInformation {
  readonly id: string
  readonly createdAt: Date
  readonly modifiedAt: Date | null
  readonly peerId: string
  readonly producerArticleId: string
  readonly consumerArticleId: string
}

export type ArticleRevisionWithProperties = PrismaArticleRevision & {
  properties: MetadataProperty[]
}

export type ArticleWithRevisions = PrismaArticle & {
  draft: ArticleRevisionWithProperties | null
  pending: ArticleRevisionWithProperties | null
  published: ArticleRevisionWithProperties | null
}
