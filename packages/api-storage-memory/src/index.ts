import {
  StorageAdapter,
  VersionState,
  ArticleBlock,
  PageBlock,
  Navigation,
  Image,
  User,
  Session,
  ArticleInput,
  Article,
  ArticleVersion,
  Page,
  PageInput,
  PageVersion,
  ArticlesArguments,
  Peer,
  PeerArguments,
  PeersArguments,
  Author
} from '@wepublish/api'

export interface MemoryPeer {
  id: string
  name: string
  url: string
}

export interface MockArticleVersion {
  state: VersionState

  createdAt: Date
  updatedAt: Date
  breaking: boolean

  title: string
  lead: string
  slug: string
  imageID?: string

  blocks: ArticleBlock[]
  authorIDs: string[]
}

export interface MemoryArticle {
  id: string
  versions: MockArticleVersion[]
  peer?: MemoryPeer
}

export interface MemoryPageVersion {
  state: VersionState

  createdAt: Date
  updatedAt: Date

  title: string
  description: string
  slug: string

  blocks: PageBlock[]
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

export class MemoryStorageAdapter implements StorageAdapter {
  private _users: MemoryUser[] = []
  private _sessions: MemoryUserSession[] = []
  private _articles: MemoryArticle[] = []
  private _pages: MemoryPage[] = []
  private _peers: MemoryPeer[] = []
  private _navigations: Navigation[] = []
  private _images: Image[] = []
  private _authors: Author[] = []

  constructor({users = [], peers = []}: MockAdapterOptions = {}) {
    this._users.push(...users)
    this._peers.push(...peers)
  }

  async getUserForCredentials(email: string, password: string): Promise<User | null> {
    const user = this._users.find(user => user.email === email && user.password === password)
    return user ? {id: user.id, email: user.email} : null
  }

  async createSession(user: User, token: string, expiryDate: Date): Promise<Session> {
    this._sessions.push({userID: user.id, token, expiryDate})
    return {user, token, expiryDate}
  }

  async deleteSession(user: User, revokeToken: string): Promise<Session | null> {
    const index = this._sessions.findIndex(
      ({userID, token}) => userID === user.id && token === revokeToken
    )

    if (index === -1) return null

    const {expiryDate} = this._sessions[index]
    this._sessions.splice(index, 1)

    return {user, token: revokeToken, expiryDate}
  }

  async getSession(verifyToken: string): Promise<Session | null> {
    const {userID, expiryDate} = this._sessions.find(({token}) => token === verifyToken) || {}
    const user = this._users.find(user => user.id === userID)!

    if (!user || !expiryDate) return null

    return {user, token: verifyToken, expiryDate}
  }

  async createNavigation(navigation: Navigation): Promise<Navigation> {
    this._navigations.push(navigation)
    return navigation
  }

  async getNavigation(key: string): Promise<Navigation | null> {
    return this._navigations.find(navigation => navigation.key === key) || null
  }

  async createImage(image: Image): Promise<Image> {
    this._images.push(image)
    return image
  }

  async getImage(id: string): Promise<Image | null> {
    return this._images.find(({id: imageID}) => imageID === id) || null
  }

  async getImages(offset: number, limit: number): Promise<[number, Image[]]> {
    const sorted = this._images
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return [this._images.length, sorted.slice(offset, offset + limit)]
  }

  async createAuthor(author: Author): Promise<Author> {
    this._authors.push(author)
    return author
  }

  async getAuthor(id: string): Promise<Author | null> {
    return this._authors.find(author => author.id === id) || null
  }

  async createArticle(article: ArticleInput): Promise<Article> {
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
        articleVersion.state === VersionState.Published ? articleVersion.publishDate : undefined,

      publishedVersion: articleVersion.state === VersionState.Published ? 0 : undefined,
      draftVersion: articleVersion.state === VersionState.Draft ? 0 : undefined
    }
  }

  async getArticle(id: string): Promise<Article | null> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return null

    const reverseVersions = article.versions.slice().reverse()

    const oldestVersion = article.versions[0]
    const latestVersion = article.versions[article.versions.length - 1]

    const publishedVersion = reverseVersions.find(
      version => version.state === VersionState.Published
    )

    const draftVersion = reverseVersions.find(
      version => version.state === VersionState.Draft || version.state === VersionState.DraftReview
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

  async getArticleVersion(id: string, version: number): Promise<ArticleVersion | null> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return null

    const articleVersion = article.versions[version]

    return {
      articleID: id,
      ...articleVersion,
      version
    }
  }

  async getArticleVersionBlocks(id: string, version: number): Promise<ArticleBlock[]> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return []

    const articleVersion = article.versions[version]
    return articleVersion ? articleVersion.blocks : []
  }

  async getArticleVersions(id: string): Promise<ArticleVersion[]> {
    const article = this._articles.find(article => article.id === id)
    if (!article) throw new Error(`Couldn't find article with ID: ${id}`)
    return article.versions.map((articleVersion, index) => ({
      articleID: id,
      ...articleVersion,
      version: index
    }))
  }

  async createPage(page: PageInput): Promise<Page> {
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
        pageVersion.state === VersionState.Published ? pageVersion.publishDate : undefined,

      publishedVersion: pageVersion.state === VersionState.Published ? 0 : undefined,
      draftVersion: pageVersion.state === VersionState.Draft ? 0 : undefined
    }
  }

  async getPage(id: string): Promise<Page | null> {
    const page = this._pages.find(page => page.id === id)

    if (!page) return null

    const reverseVersions = page.versions.slice().reverse()

    const oldestVersion = page.versions[0]
    const latestVersion = page.versions[page.versions.length - 1]

    const publishedVersion = reverseVersions.find(
      version => version.state === VersionState.Published
    )

    const draftVersion = reverseVersions.find(
      version => version.state === VersionState.Draft || version.state === VersionState.DraftReview
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

  async getPageBySlug(slug: string): Promise<Page | null> {
    const page = this._pages.find(page => {
      const reverseVersions = page.versions.slice().reverse()
      const publishedVersion = reverseVersions.find(
        version => version.state === VersionState.Published
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
      version => version.state === VersionState.Published
    )

    const draftVersion = reverseVersions.find(
      version => version.state === VersionState.Draft || version.state === VersionState.DraftReview
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

  async getPageVersion(id: string, version: number): Promise<PageVersion | null> {
    const page = this._pages.find(article => article.id === id)

    if (!page) return null

    const pageVersion = page.versions[version]

    return {
      articleID: id,
      ...pageVersion,
      version
    }
  }

  async getPageVersionBlocks(id: string, version: number): Promise<PageBlock[]> {
    const page = this._pages.find(article => article.id === id)

    if (!page) return []

    const pageVersion = page.versions[version]
    return pageVersion ? pageVersion.blocks : []
  }

  async getPageVersions(id: string): Promise<PageVersion[]> {
    const page = this._pages.find(article => article.id === id)
    if (!page) throw new Error(`Couldn't find article with ID: ${id}`)
    return page.versions.map((articleVersion, index) => ({
      articleID: id,
      ...articleVersion,
      version: index
    }))
  }

  async getArticles(_args: ArticlesArguments): Promise<Article[]> {
    const articles = this._articles.map(article => {
      const reverseVersions = article.versions.slice().reverse()

      const oldestVersion = article.versions[0]
      const latestVersion = article.versions[article.versions.length - 1]

      const publishedVersion = reverseVersions.find(
        version => version.state === VersionState.Published
      )

      const draftVersion = reverseVersions.find(
        version =>
          version.state === VersionState.Draft || version.state === VersionState.DraftReview
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

  async getPeer(args: PeerArguments): Promise<Peer | null> {
    return this._peers.find(peer => peer.id === args.id) || null
  }

  async getPeers(_args: PeersArguments): Promise<Peer[]> {
    return this._peers
  }
}
