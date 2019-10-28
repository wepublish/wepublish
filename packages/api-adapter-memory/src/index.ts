import {
  Adapter,
  ArticlesArguments,
  PeerArguments,
  PeersArguments,
  AdapterArticle,
  AdapterArticleVersion,
  AdapterNavigation,
  AdapterUser,
  Peer,
  ArticleVersionState,
  InvalidTokenError,
  TokenExpiredError,
  AdapterArticleBlock,
  AdapterImage,
  AdapterArticleInput,
  AdapterPageInput,
  AdapterPage,
  AdapterPageBlock,
  AdapterPageVersion
} from '@wepublish/api'

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
  slug: string

  blocks: AdapterArticleBlock[]
}

export interface MemoryArticle {
  id: string
  versions: MockArticleVersion[]
  peer?: MemoryPeer
}

export interface MemoryPageVersion {
  state: ArticleVersionState

  createdAt: Date
  updatedAt: Date

  title: string
  description: string
  slug: string

  blocks: AdapterPageBlock[]
}

export interface MemoryPage {
  id: string
  versions: MemoryPageVersion[]
  peer?: MemoryPeer
}

export interface MockAdapterOptions {
  users?: MemoryUser[]
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
  private _pages: MemoryPage[] = []
  private _peers: MemoryPeer[] = []
  private _navigations: AdapterNavigation[] = []
  private _images: AdapterImage[] = []

  constructor({users = [], peers = []}: MockAdapterOptions = {}) {
    this._users.push(...users)
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

    return this._users.find(user => user.id === userID)!
  }

  async createNavigation(navigation: AdapterNavigation): Promise<AdapterNavigation> {
    this._navigations.push(navigation)
    return navigation
  }

  async getNavigation(key: string): Promise<AdapterNavigation | null> {
    return this._navigations.find(navigation => navigation.key === key) || null
  }

  async createImage(image: AdapterImage): Promise<AdapterImage> {
    this._images.push(image)
    return image
  }

  async getImage(id: string): Promise<AdapterImage | null> {
    return this._images.find(({id: imageID}) => imageID === id) || null
  }

  async createArticle(article: AdapterArticleInput): Promise<AdapterArticle> {
    const articleVersion = {
      ...article,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const mockArticle: MemoryArticle = {
      id: article.id,
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

  async getArticle(id: string): Promise<AdapterArticle | null> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return null

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
  }

  async getArticleVersion(id: string, version: number): Promise<AdapterArticleVersion | null> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return null

    const articleVersion = article.versions[version]

    return {
      articleID: id,
      ...articleVersion,
      version
    }
  }

  async getArticleVersionBlocks(id: string, version: number): Promise<AdapterArticleBlock[]> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return []

    const articleVersion = article.versions[version]
    return articleVersion ? articleVersion.blocks : []
  }

  async getArticleVersions(id: string): Promise<AdapterArticleVersion[]> {
    const article = this._articles.find(article => article.id === id)
    if (!article) throw new Error(`Couldn't find article with ID: ${id}`)
    return article.versions.map((articleVersion, index) => ({
      articleID: id,
      ...articleVersion,
      version: index
    }))
  }

  async createPage(page: AdapterPageInput): Promise<AdapterPage> {
    const pageVersion = {
      ...page,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const memoryPage: MemoryPage = {
      id: page.id,
      versions: [pageVersion]
    }

    this._pages.push(memoryPage)

    return {
      id: memoryPage.id,

      createdAt: pageVersion.createdAt,
      updatedAt: pageVersion.updatedAt,

      publishedAt:
        pageVersion.state === ArticleVersionState.Published ? pageVersion.publishDate : undefined,

      publishedVersion: pageVersion.state === ArticleVersionState.Published ? 0 : undefined,
      draftVersion: pageVersion.state === ArticleVersionState.Draft ? 0 : undefined
    }
  }

  async getPage(id: string): Promise<AdapterPage | null> {
    const page = this._pages.find(page => page.id === id)

    if (!page) return null

    const reverseVersions = page.versions.slice().reverse()

    const oldestVersion = page.versions[0]
    const latestVersion = page.versions[page.versions.length - 1]

    const publishedVersion = reverseVersions.find(
      version => version.state === ArticleVersionState.Published
    )

    const draftVersion = reverseVersions.find(
      version =>
        version.state === ArticleVersionState.Draft ||
        version.state === ArticleVersionState.DraftReview
    )

    return {
      id: page.id,

      createdAt: oldestVersion.createdAt,
      updatedAt: latestVersion.updatedAt,

      publishedAt: publishedVersion && publishedVersion.updatedAt,

      publishedVersion: publishedVersion ? page.versions.indexOf(publishedVersion) : undefined,
      draftVersion: draftVersion ? page.versions.indexOf(draftVersion) : undefined
    }
  }

  async getPageBySlug(slug: string): Promise<AdapterPage | null> {
    const page = this._pages.find(page => {
      const reverseVersions = page.versions.slice().reverse()
      const publishedVersion = reverseVersions.find(
        version => version.state === ArticleVersionState.Published
      )

      if (publishedVersion) {
        return publishedVersion.slug === slug
      }

      return false
    })

    if (!page) return null

    const reverseVersions = page.versions.slice().reverse()

    const oldestVersion = page.versions[0]
    const latestVersion = page.versions[page.versions.length - 1]

    const publishedVersion = reverseVersions.find(
      version => version.state === ArticleVersionState.Published
    )

    const draftVersion = reverseVersions.find(
      version =>
        version.state === ArticleVersionState.Draft ||
        version.state === ArticleVersionState.DraftReview
    )

    return {
      id: page.id,

      createdAt: oldestVersion.createdAt,
      updatedAt: latestVersion.updatedAt,

      publishedAt: publishedVersion && publishedVersion.updatedAt,

      publishedVersion: publishedVersion ? page.versions.indexOf(publishedVersion) : undefined,
      draftVersion: draftVersion ? page.versions.indexOf(draftVersion) : undefined
    }
  }

  async getPageVersion(id: string, version: number): Promise<AdapterPageVersion | null> {
    const page = this._pages.find(article => article.id === id)

    if (!page) return null

    const pageVersion = page.versions[version]

    return {
      articleID: id,
      ...pageVersion,
      version
    }
  }

  async getPageVersionBlocks(id: string, version: number): Promise<AdapterPageBlock[]> {
    const page = this._pages.find(article => article.id === id)

    if (!page) return []

    const pageVersion = page.versions[version]
    return pageVersion ? pageVersion.blocks : []
  }

  async getPageVersions(id: string): Promise<AdapterPageVersion[]> {
    const page = this._pages.find(article => article.id === id)
    if (!page) throw new Error(`Couldn't find article with ID: ${id}`)
    return page.versions.map((articleVersion, index) => ({
      articleID: id,
      ...articleVersion,
      version: index
    }))
  }

  async getArticles(_args: ArticlesArguments): Promise<AdapterArticle[]> {
    const articles = this._pages.map(article => {
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
