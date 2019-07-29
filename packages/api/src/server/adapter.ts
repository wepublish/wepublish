export interface ArticleArguments {
  peer?: string
  id?: string
}

export interface ArticlesArguments {
  // peer?: string
  dateRange: {
    start: Date
    end: Date
  }
}

export interface PeerArguments {
  id?: string
}

export interface PeersArguments {}

export interface Article {
  peer?: string
  id: string
  title: string
  lead: string
  publishedDate: Date
}

export interface ArticleEdge {
  node: Article
  cursor: string
}

export interface PaginatedArticles {
  nodes: Article[]
  pageInfo: {
    dateRange: {
      start: Date
      end: Date
    }
  }
  totalCount: number
}

export interface Peer {
  id: string
  name: string
  url: string
}

export interface ArticleCreateInput {
  title: string
  lead: string
  publishedDate: Date
}

export interface ArticleCreateArguments {
  article: ArticleCreateInput
}

export interface Adapter {
  createArticle(id: string, args: ArticleCreateArguments): Article

  getArticle(args: ArticleArguments): Article | undefined
  getArticles(args: ArticlesArguments): PaginatedArticles

  getPeer(args: PeerArguments): Peer | undefined
  getPeers(args: PeersArguments): Peer[]
}

export default Adapter
