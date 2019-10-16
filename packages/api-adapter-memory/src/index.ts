import {
  Adapter,
  ArticlesArguments,
  PeerArguments,
  PeersArguments,
  AdapterArticle,
  AdapterArticleVersion,
  AdapterUser,
  AdapterSession
} from '@wepublish/api/server'

import {Peer, ArticleVersionState} from '@wepublish/api'
import {ArticleInput, Block} from '@wepublish/api/server'

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

  blocks: Block[]
}

export interface MockArticle {
  id: string
  versions: MockArticleVersion[]
  peer?: MockPeer
}

export interface MockAdapterOptions {
  users?: MockUser[]
  articles?: MockArticle[]
  peers?: MockPeer[]
}

export interface MockUser {
  readonly email: string
  readonly password: string
}

export interface MockSession {
  readonly email: string
  readonly token: string
}

export class MockAdapter implements Adapter {
  private _users: MockUser[] = []
  private _sessions: MockSession[] = []
  private _articles: MockArticle[] = []
  private _peers: MockPeer[] = []

  constructor({users = [], articles = [], peers = []}: MockAdapterOptions = {}) {
    this._users.push(...users)
    this._articles.push(...articles)
    this._peers.push(...peers)
  }

  async userForCredentials(email: string, password: string): Promise<AdapterUser | null> {
    const user = this._users.find(user => user.email === email && user.password === password)
    return user ? {email: user.email} : null
  }

  async userForEmail(email: string): Promise<AdapterUser | null> {
    return {email}
  }

  async insertRefreshTokenID(user: AdapterUser, token: string): Promise<void> {
    this._sessions.push({email: user.email, token})
  }

  async revokeRefreshTokenID(revokeToken: string): Promise<void> {
    this._sessions.splice(this._sessions.findIndex(({token}) => token === revokeToken), 1)
  }

  async verifyRefreshTokenID(verifyToken: string): Promise<boolean> {
    return this._sessions.some(({email, token}) => token === verifyToken)
  }

  async createArticle(id: string, article: ArticleInput): Promise<AdapterArticle> {
    const articleVersion = {
      ...article,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const mockArticle: MockArticle = {
      id,
      versions: [articleVersion]
    }

    this._articles.push(mockArticle)

    return {
      id: mockArticle.id,
      peer: mockArticle.peer,

      createdAt: articleVersion.createdAt,
      updatedAt: articleVersion.updatedAt,

      publishedAt:
        articleVersion.state === ArticleVersionState.Published
          ? articleVersion.updatedAt
          : undefined,

      publishedVersion: articleVersion.state === ArticleVersionState.Published ? 0 : undefined,
      draftVersion: articleVersion.state === ArticleVersionState.Draft ? 0 : undefined
    }
  }

  async getArticleVersionContent(id: string, version: number): Promise<any> {
    return {}
  }

  async getArticleVersion(id: string, version: number): Promise<AdapterArticleVersion> {
    const article = this._articles.find(article => article.id === id)

    if (!article) throw new Error(`Couldn't find article with ID: ${id}`)

    const articleVersion = article.versions[version]

    return {
      ...articleVersion,
      version
    }
  }

  async getArticleVersions(id: string): Promise<AdapterArticleVersion[]> {
    const article = this._articles.find(article => article.id === id)
    if (!article) throw new Error(`Couldn't find article with ID: ${id}`)
    return article.versions.map((articleVersion, index) => ({...articleVersion, version: index}))
  }

  async getArticles(args: ArticlesArguments): Promise<AdapterArticle[]> {
    const articles = this._articles.map(article => {
      const reverseVersions = article.versions.slice().reverse()

      const oldestVersion = article.versions[0]
      const latestVersion = article.versions[article.versions.length - 1]

      const publishedVersion = reverseVersions.find(
        version => version.state === ArticleVersionState.Published
      )

      const draftVersion = reverseVersions.find(
        version =>
          version.state === ArticleVersionState.Draft ||
          version.state === ArticleVersionState.DraftReview
      )

      return {
        id: article.id,
        peer: article.peer,

        createdAt: oldestVersion.createdAt,
        updatedAt: latestVersion.updatedAt,

        publishedAt: publishedVersion && publishedVersion.updatedAt,

        publishedVersion: publishedVersion ? article.versions.indexOf(publishedVersion) : undefined,
        draftVersion: draftVersion ? article.versions.indexOf(draftVersion) : undefined
      }
    })

    return articles
  }

  async createPeer(): Promise<Peer> {
    return {} as any
  }

  async getPeer(args: PeerArguments): Promise<Peer | undefined> {
    return this._peers.find(peer => peer.id === args.id)
  }

  async getPeers(args: PeersArguments): Promise<Peer[]> {
    return this._peers
  }
}

export default MockAdapter
