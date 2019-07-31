import {Article, ArticleVersionState} from '../shared'

export interface DateRange {
  start: Date
  end: Date
}

export interface ArticleArguments {
  peer?: string
  id?: string
}

export interface ArticlesArguments {
  limit: number

  publishedBetween: DateRange
  updatedBetween: DateRange
  createdBetween: DateRange

  tagsInclude: string[]
  includePeers: boolean
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

  publishedVersion?: number
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
  // Articles
  createArticle(id: string, args: ArticleCreateArguments): Promise<AdapterArticle>
  // updateArticle(id: string, args: ArticleCreateArguments): Article

  getArticles(args: ArticlesArguments): Promise<AdapterArticle[]>

  getArticleVersion(id: string, version: number): Promise<AdapterArticleVersion>
  getArticleVersions(id: string): Promise<AdapterArticleVersion[]>
  getArticleVersionContent(id: string, version: number): Promise<AdapterArticleVersionContent>

  // Peers
  createPeer(id: string, args: any): Promise<Peer>

  getPeer(args: PeerArguments): Promise<Peer | undefined>
  getPeers(args: PeersArguments): Promise<Peer[]>

  // Pages
  // Front

  // Navigation
}
