import {
  MetadataProperty,
  ArticleRevisionAuthor,
  ArticleRevisionSocialMediaAuthor
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
  readonly disableComments?: boolean | null

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
  readonly disableComments?: boolean | null
}
