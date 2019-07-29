import {
  Adapter,
  ArticleType,
  ArticleArguments,
  ArticlesArguments,
  Peer,
  PeerArguments,
  PeersArguments,
  ArticleCreateArguments,
  PaginatedArticles
} from '@wepublish/api'

export interface MockAdapterOptions {
  articles?: ArticleType[]
  peers?: Peer[]
}

export class MockAdapter implements Adapter {
  private _articles: ArticleType[]
  private _peers: Peer[]

  constructor(opts: MockAdapterOptions = {}) {
    this._articles = opts.articles || []
    this._peers = opts.peers || []
  }

  createArticle(id: string, args: ArticleCreateArguments): ArticleType {
    const article = {...args.article, id}
    this._articles.push(article)
    return article
  }

  getArticle(args: ArticleArguments): ArticleType | undefined {
    return this._articles.find(article => article.id === args.id)
  }

  getArticles(args: ArticlesArguments): PaginatedArticles {
    const nodes = this._articles.filter(
      article =>
        article.publishedDate >= args.dateRange.start && article.publishedDate < args.dateRange.end
    )

    return {
      nodes,
      pageInfo: {
        dateRange: args.dateRange
      },
      totalCount: nodes.length
    }
  }

  getPeer(args: PeerArguments): Peer | undefined {
    return this._peers.find(peer => peer.id === args.id)
  }

  getPeers(args: PeersArguments): Peer[] {
    return this._peers
  }
}

export default MockAdapter
