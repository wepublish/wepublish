export enum ArticleVersionState {
  Draft = 'draft',
  Review = 'review',
  Published = 'publish'
}

export interface Article {
  id: string
  peer?: Peer

  createdAt: Date
  updatedAt: Date
  publishedAt?: Date

  latest?: ArticleVersion
  published?: ArticleVersion
  review?: ArticleVersion
  draft?: ArticleVersion

  versions: ArticleVersion[]
}

export interface ArticleVersion {
  version: number
  state: ArticleVersionState

  createdAt: Date
  updatedAt: Date

  title: string
  lead: string
}

export interface Peer {
  id: string
  name: string
  url: string
}
