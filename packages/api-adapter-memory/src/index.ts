import {
  Adapter,
  ArticlesArguments,
  PeerArguments,
  PeersArguments,
  AdapterArticle,
  AdapterArticleVersion,
  AdapterUser
} from '@wepublish/api/server'

import {Peer, ArticleVersionState} from '@wepublish/api'
import {ArticleInput, Block} from '@wepublish/api/server'
import {InvalidTokenError, TokenExpiredError} from '@wepublish/api/lib/cjs/server/graphql/error'

export interface MemoryPeer {
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

export interface MemoryArticle {
  id: string
  versions: MockArticleVersion[]
  peer?: MemoryPeer
}

export interface MockAdapterOptions {
  users?: MemoryUser[]
  articles?: MemoryArticle[]
  peers?: MemoryPeer[]
}

export interface MemoryUser {
  readonly id: string
  readonly email: string
  readonly password: string
}

export interface MemoryUserSession {
  readonly userID: string
  readonly expiryDate: Date
  readonly token: string
}

export class MemoryAdapter implements Adapter {
  private _users: MemoryUser[] = []
  private _sessions: MemoryUserSession[] = []
  private _articles: MemoryArticle[] = []
  private _peers: MemoryPeer[] = []

  constructor({users = [], articles = [], peers = []}: MockAdapterOptions = {}) {
    this._users.push(...users)
    this._articles.push(...articles)
    this._peers.push(...peers)
  }

  async getUserForCredentials(email: string, password: string): Promise<AdapterUser | null> {
    const user = this._users.find(user => user.email === email && user.password === password)
    return user ? {id: user.id, email: user.email} : null
  }

  async createSession({id: userID}: AdapterUser, token: string, expiryDate: Date): Promise<void> {
    this._sessions.push({userID, token, expiryDate})
  }

  async revokeSession({id: revokeUserID}: AdapterUser, revokeToken: string): Promise<void> {
    this._sessions.splice(
      this._sessions.findIndex(
        ({userID, token}) => userID === revokeUserID && token === revokeToken
      ),
      1
    )
  }

  async getSessionUser(verifyToken: string): Promise<AdapterUser> {
    const {userID, expiryDate} = this._sessions.find(({token}) => token === verifyToken) || {}

    if (!userID || !expiryDate) {
      throw new InvalidTokenError()
    }

    if (expiryDate < new Date()) {
      throw new TokenExpiredError()
    }

    return this._users.find(({id}) => id === userID)!
  }

  async createArticle(id: string, article: ArticleInput): Promise<AdapterArticle> {
    const articleVersion = {
      ...article,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const mockArticle: MemoryArticle = {
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
          ? articleVersion.publishDate
          : undefined,

      publishedVersion: articleVersion.state === ArticleVersionState.Published ? 0 : undefined,
      draftVersion: articleVersion.state === ArticleVersionState.Draft ? 0 : undefined
    }
  }

  async getArticleVersionContent(_id: string, _version: number): Promise<any> {
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

  async getArticles(_args: ArticlesArguments): Promise<AdapterArticle[]> {
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

  async getPeers(_args: PeersArguments): Promise<Peer[]> {
    return this._peers
  }
}

export default MemoryAdapter
