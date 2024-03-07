import {
  MetadataProperty,
  Article as PrismaArticle,
  ArticleRevision as PrismaArticleRevision,
  ArticleRevisionAuthor,
  ArticleRevisionSocialMediaAuthor
} from '@prisma/client'
import {ArticleBlock} from './block'
import {DateFilter} from './common'

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
  readonly authors: ArticleRevisionAuthor[]

  readonly breaking: boolean
  readonly blocks: ArticleBlock[]

  readonly hideAuthor: boolean

  readonly socialMediaTitle?: string | null
  readonly socialMediaDescription?: string | null
  readonly socialMediaAuthors: ArticleRevisionSocialMediaAuthor[]
  readonly socialMediaImageID?: string | null
}

// Article State Flow:
// Draft -> Pending (Optional) -> Published
export interface Article extends ArticleData {
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
  article: Article
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
  readonly peeredArticleURL?: string
}

export interface ArticleFilter {
  readonly title?: string
  readonly preTitle?: string
  readonly publicationDateFrom?: DateFilter
  readonly publicationDateTo?: DateFilter
  readonly lead?: string
  readonly draft?: boolean
  readonly published?: boolean
  readonly pending?: boolean
  readonly shared?: boolean
  readonly authors?: string[]
  readonly tags?: string[]
  readonly includeHidden?: boolean
}

export interface PublicArticleFilter {
  readonly authors?: string[]
  readonly tags?: string[]
  readonly includeHidden?: boolean
}

export enum ArticleSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
  PublishedAt = 'publishedAt',
  UpdatedAt = 'updatedAt',
  PublishAt = 'publishAt'
}

export type ArticleRevisionWithRelations = PrismaArticleRevision & {
  properties: MetadataProperty[]
  authors: ArticleRevisionAuthor[]
  socialMediaAuthors: ArticleRevisionSocialMediaAuthor[]
}

export type ArticleWithRevisions = PrismaArticle & {
  draft: ArticleRevisionWithRelations | null
  pending: ArticleRevisionWithRelations | null
  published: ArticleRevisionWithRelations | null
}

export const articleWithRevisionsToPublicArticle = ({
  id,
  shared,
  published,
  pending
}: Omit<ArticleWithRevisions, 'draft'>): PublicArticle => {
  const returnValue = {shared, ...(published || pending!), id}

  return {
    ...returnValue,
    blocks: returnValue.blocks as ArticleBlock[]
  }
}
