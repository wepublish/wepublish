import {Article, ArticleVersionState} from '../shared'

export interface ArticleArguments {
  peer?: string
  id?: string
}

export interface ArticlesArguments {
  publishedBetween: {
    start: Date
    end: Date
  }
}

export interface PeerArguments {
  id?: string
}

export interface PeersArguments {}

export interface ArticleVersion {
  title: string
  lead: string
  publishedDate: Date
}

export interface Peer {
  id: string
  name: string
  url: string
}

export interface ArticleInput {
  state: ArticleVersionState

  title: string
  lead: string

  publishDate?: Date
}

export interface ArticleCreateArguments {
  article: ArticleInput
}

export interface AdapterArticle {
  id: string
  peer?: Peer

  createdAt: Date
  updatedAt: Date
  publishedAt?: Date

  latestVersion: number
  publishedVersion?: number
  reviewVersion?: number
  draftVersion?: number
}

export interface AdapterArticleVersion {
  version: number
  state: ArticleVersionState

  createdAt: Date
  updatedAt: Date

  title: string
  lead: string
}

export type AdapterArticleVersionContent = any

export interface Adapter {
  createArticle(id: string, args: ArticleCreateArguments): AdapterArticle
  // updateArticle(id: string, args: ArticleCreateArguments): Article

  getArticleVersion(id: string, version: number): AdapterArticleVersion
  getArticleVersions(id: string): AdapterArticleVersion[]

  getArticles(args: ArticlesArguments): AdapterArticle[]
  getArticleVersionContent(id: string, version: number): AdapterArticleVersionContent

  getPeer(args: PeerArguments): Peer | undefined
  getPeers(args: PeersArguments): Peer[]
}
