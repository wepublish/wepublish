export interface ArticleArguments {
  peer?: string
  id?: string
}

export interface ArticlesArguments {
  // peer?: string
  first: number
  after?: string
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
}

export interface ArticleEdge {
  node: Article
  cursor: string
}

export interface PaginatedArticles {
  edges: ArticleEdge[]
  info: {
    startCursor: string
    endCursor: string
    hasNextPage: boolean
  }
}

export interface Peer {
  id: string
  name: string
  url: string
}

export interface ArticleCreateInput {
  title: string
  lead: string
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
