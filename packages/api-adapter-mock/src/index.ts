import {
  Adapter,
  Article,
  ArticleArguments,
  ArticlesArguments,
  Peer,
  PeerArguments,
  PeersArguments,
  ArticleCreateArguments,
  PaginatedArticles
} from '@wepublish/api'

export interface MockAdapterOptions {
  articles?: Article[]
  peers?: Peer[]
}

export class MockAdapter implements Adapter {
  private _articles: Article[]
  private _peers: Peer[]

  constructor(opts: MockAdapterOptions = {}) {
    this._articles = opts.articles || []
    this._peers = opts.peers || []
  }

  createArticle(id: string, args: ArticleCreateArguments): Article {
    const article = {...args.article, id}
    this._articles.push(article)
    return article
  }

  getArticle(args: ArticleArguments): Article | undefined {
    return this._articles.find(article => article.id === args.id)
  }

  getArticles(args: ArticlesArguments): PaginatedArticles {
    const startCursor = args.after ? parseInt(args.after) : 0

    const edges = this._articles
      .slice(startCursor, args.first)
      .map((article, index) => ({node: article, cursor: index.toString()}))

    return {
      edges: edges,
      info: {
        startCursor: edges[0].cursor,
        endCursor: edges[edges.length - 1].cursor,
        hasNextPage: false
      }
    }

    // return this._articles.filter(article => args.peer === undefined || article.peer == args.peer)
  }

  getPeer(args: PeerArguments): Peer | undefined {
    return this._peers.find(peer => peer.id === args.id)
  }

  getPeers(args: PeersArguments): Peer[] {
    return this._peers
  }
}

export default MockAdapter
