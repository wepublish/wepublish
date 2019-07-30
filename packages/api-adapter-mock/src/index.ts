import {Adapter, ArticlesArguments, PeerArguments, PeersArguments} from '@wepublish/api/server'
import {Article, Peer, ArticleVersionState} from '@wepublish/api'
import {
  ArticleCreateArguments,
  AdapterArticle,
  AdapterArticleVersion
} from '@wepublish/api/lib/cjs/server'

export interface MockPeer {
  id: string
  name: string
  url: string
}

export interface MockArticleVersion {
  state: ArticleVersionState

  createdAt: Date
  updatedAt: Date

  title: string
  lead: string
}

export interface MockArticle {
  id: string
  versions: MockArticleVersion[]
  peer?: MockPeer
}

export interface MockAdapterOptions {
  articles?: MockArticle[]
  peers?: MockPeer[]
}

export class MockAdapter implements Adapter {
  private _articles: MockArticle[]
  private _peers: MockPeer[]

  constructor(opts: MockAdapterOptions = {}) {
    this._articles = opts.articles || []
    this._peers = opts.peers || []
  }

  createArticle(id: string, args: ArticleCreateArguments): AdapterArticle {
    const articleVersion = {
      ...args.article,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const article: MockArticle = {
      id,
      versions: [articleVersion]
    }

    this._articles.push(article)

    return {
      id: article.id,
      peer: article.peer,

      createdAt: articleVersion.createdAt,
      updatedAt: articleVersion.updatedAt,

      publishedAt:
        articleVersion.state === ArticleVersionState.Published
          ? articleVersion.updatedAt
          : undefined,

      latestVersion: 0,
      publishedVersion: articleVersion.state === ArticleVersionState.Published ? 0 : undefined,
      reviewVersion: articleVersion.state === ArticleVersionState.Review ? 0 : undefined,
      draftVersion: articleVersion.state === ArticleVersionState.Draft ? 0 : undefined
    }
  }

  // getArticle(args: ArticleArguments): Article | undefined {
  //   return this._articles.find(article => article.id === args.id)
  // }

  getArticleVersionContent(id: string, version: number): any {
    return {}
  }

  getArticleVersion(id: string, version: number): AdapterArticleVersion {
    const article = this._articles.find(article => article.id === id)

    if (!article) throw new Error(`Couldn't find article with ID: ${id}`)

    const articleVersion = article.versions[version]

    return {
      ...articleVersion,
      version
    }
  }

  getArticleVersions(id: string): AdapterArticleVersion[] {
    const article = this._articles.find(article => article.id === id)
    if (!article) throw new Error(`Couldn't find article with ID: ${id}`)
    return article.versions.map((articleVersion, index) => ({...articleVersion, version: index}))
  }

  getArticles(args: ArticlesArguments): AdapterArticle[] {
    // const nodes = this._articles.filter(
    //   article =>
    //     article.publishedDate >= args.dateRange.start && article.publishedDate < args.dateRange.end
    // )

    const articles = this._articles.map(article => {
      const reverseVersions = article.versions.slice().reverse()

      const oldestVersion = article.versions[0]
      const latestVersion = article.versions[article.versions.length - 1]

      const publishedVersion = reverseVersions.find(
        version => version.state === ArticleVersionState.Published
      )

      const draftVersion = reverseVersions.find(
        version => version.state === ArticleVersionState.Draft
      )

      const reviewVersion = reverseVersions.find(
        version => version.state === ArticleVersionState.Review
      )

      return {
        id: article.id,
        peer: article.peer,

        createdAt: oldestVersion.createdAt,
        updatedAt: latestVersion.updatedAt,

        publishedAt: publishedVersion && publishedVersion.updatedAt,

        latestVersion: article.versions.indexOf(latestVersion),
        publishedVersion: publishedVersion ? article.versions.indexOf(publishedVersion) : undefined,
        draftVersion: draftVersion ? article.versions.indexOf(draftVersion) : undefined,
        reviewVersion: reviewVersion ? article.versions.indexOf(reviewVersion) : undefined
      }
    })

    return articles
  }

  getPeer(args: PeerArguments): Peer | undefined {
    return this._peers.find(peer => peer.id === args.id)
  }

  getPeers(args: PeersArguments): Peer[] {
    return this._peers
  }
}

export default MockAdapter
