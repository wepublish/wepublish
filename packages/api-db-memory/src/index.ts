import {
  StorageAdapter,
  VersionState,
  ArticleBlock,
  PageBlock,
  Navigation,
  Image,
  ImageUpdate,
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
  Author,
  PageInfo,
  Pagination
} from '@wepublish/api'

type Writeable<T> = {-readonly [P in keyof T]: T[P]}

interface MemoryPeer {
  id: string
  name: string
  url: string
}

interface MemoryArticleVersion extends Writeable<ArticleVersion> {}

type MemoryImage = Writeable<Image>

interface MemoryArticle {
  id: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  publishedVersion?: number
  versions: MemoryArticleVersion[]
  peer?: MemoryPeer
}

interface MemoryPageVersion extends Writeable<PageVersion> {}

interface MemoryPage {
  id: string
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
  publishedVersion?: number
  versions: MemoryPageVersion[]
}

interface MemoryUser {
  readonly id: string
  readonly email: string
  readonly password: string
}

interface MemoryUserSession {
  readonly userID: string
  readonly expiryDate: Date
  readonly token: string
}

export interface MemoryAdapterOptions {
  users?: MemoryUser[]
  peers?: MemoryPeer[]
}

export class MemoryStorageAdapter implements StorageAdapter {
  private _users: MemoryUser[] = []
  private _sessions: MemoryUserSession[] = []
  private _articles: MemoryArticle[] = []
  private _pages: MemoryPage[] = []
  private _peers: MemoryPeer[] = []
  private _navigations: Navigation[] = []
  private _images: MemoryImage[] = []
  private _authors: Author[] = []

  constructor({users = [], peers = []}: MemoryAdapterOptions = {}) {
    this._users.push(...users)
    this._peers.push(...peers)
  }

  async createUser(id: string, email: string, password: string): Promise<User> {
    const user = {id, email, password}
    this._users.push(user)
    return {id, email}
  }

  async getUser(email: string): Promise<User | null> {
    const user = this._users.find(user => user.email === email)
    return user ? {id: user.id, email: user.email} : null
  }

  async getUserForCredentials(email: string, password: string): Promise<User | null> {
    const user = this._users.find(user => user.email === email && user.password === password)
    return user ? {id: user.id, email: user.email} : null
  }

  async createSession(user: User, token: string, expiryDate: Date): Promise<Session> {
    this._sessions.push({userID: user.id, token, expiryDate})
    return {user, token, expiryDate}
  }

  async deleteSession(revokeToken: string): Promise<void> {
    const index = this._sessions.findIndex(({token}) => token === revokeToken)
    if (index === -1) return
    this._sessions.splice(index, 1)
  }

  async getSession(verifyToken: string): Promise<Session | null> {
    const {userID, expiryDate} = this._sessions.find(({token}) => token === verifyToken) ?? {}
    const user = this._users.find(user => user.id === userID)!

    if (!user || !expiryDate) return null

    return {user, token: verifyToken, expiryDate}
  }

  async cleanSessions(): Promise<void> {
    this._sessions = this._sessions.filter(session => new Date() < session.expiryDate)
  }

  async createNavigation(navigation: Navigation): Promise<Navigation> {
    this._navigations.push(navigation)
    return navigation
  }

  async getNavigation(key: string): Promise<Navigation | null> {
    return this._navigations.find(navigation => navigation.key === key) ?? null
  }

  async createImage(image: Image): Promise<Image> {
    this._images.push(image)
    return image
  }

  async deleteImage(deleteID: string): Promise<boolean | null> {
    const index = this._images.findIndex(({id}) => id === deleteID)

    if (index !== -1) {
      this._images.splice(index, 1)
      return true
    }

    return null
  }

  async updateImage({
    id,
    updatedAt,
    filename,
    title,
    description,
    author,
    source,
    license,
    focalPoint,
    tags
  }: ImageUpdate): Promise<Image | null> {
    const image = this._images.find(({id: imageID}) => imageID === id) ?? null

    if (image) {
      image.updatedAt = updatedAt
      image.filename = filename
      image.title = title
      image.description = description
      image.tags = tags
      image.author = author
      image.source = source
      image.license = license
      image.focalPoint = focalPoint
    }

    return image
  }

  async getImagesByID(ids: readonly string[]): Promise<Array<Image | null>> {
    const images = this._images.filter(({id}) => ids.includes(id))
    return ids.map(id => images.find(image => image.id === id) ?? null)
  }

  async getImages(
    filter: string | undefined,
    {after, before, first, last}: Pagination
  ): Promise<[Image[], PageInfo, number]> {
    const sorted = this._images
      .slice()
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    let afterIndex: number | undefined = after
      ? sorted.findIndex(({id}) => id === after)
      : undefined

    let beforeIndex: number | undefined = before
      ? sorted.findIndex(({id}) => id === before)
      : undefined

    if (afterIndex === -1) afterIndex = undefined
    if (beforeIndex === -1) beforeIndex = undefined

    const paginated = sorted.slice(
      afterIndex != undefined ? Math.min(afterIndex + 1, sorted.length) : undefined,
      beforeIndex != undefined ? Math.max(beforeIndex, 0) : undefined
    )

    if (paginated.length) {
      const limited = paginated.slice(last ? -last : 0, first)
      const startCursor = limited[0].id
      const endCursor = limited[limited.length - 1].id

      return [
        limited,
        {
          startCursor,
          endCursor,
          hasNextPage: endCursor !== sorted[sorted.length - 1].id,
          hasPreviousPage: startCursor !== sorted[0].id
        },
        this._images.length
      ]
    } else {
      return [
        paginated,
        {startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false},
        this._images.length
      ]
    }
  }

  // Author
  // ======

  async createAuthor(author: Author): Promise<Author> {
    this._authors.push(author)
    return author
  }

  async updateAuthor({id: updateID, name, imageID}: Author): Promise<Author | null> {
    const author = this._authors.find(({id}) => id === updateID) ?? null

    if (author) {
      author.name = name
      author.imageID = imageID
    }

    return author
  }

  async deleteAuthor(deleteID: string): Promise<boolean | null> {
    const index = this._authors.findIndex(({id}) => id === deleteID)

    if (index !== -1) {
      this._authors.splice(index, 1)
      return true
    }

    return null
  }

  async getAuthor(id: string): Promise<Author | null> {
    return this._authors.find(author => author.id === id) ?? null
  }

  async getAuthors(
    filter: string,
    {after, before, first, last}: Pagination
  ): Promise<[Author[], PageInfo, number]> {
    const sorted = this._authors
      .filter(({name}) => (filter ? name.toLowerCase().includes(filter.toLowerCase()) : true))
      .sort((a, b) => b.name.localeCompare(a.name))

    let afterIndex: number | undefined = after
      ? sorted.findIndex(({id}) => id === after)
      : undefined

    let beforeIndex: number | undefined = before
      ? sorted.findIndex(({id}) => id === before)
      : undefined

    if (afterIndex === -1) afterIndex = undefined
    if (beforeIndex === -1) beforeIndex = undefined

    const paginated = sorted.slice(
      afterIndex != undefined ? Math.min(afterIndex + 1, sorted.length) : undefined,
      beforeIndex != undefined ? Math.max(beforeIndex, 0) : undefined
    )

    if (paginated.length) {
      const limited = paginated.slice(last ? -last : 0, first)
      const startCursor = limited[0].id
      const endCursor = limited[limited.length - 1].id

      return [
        limited,
        {
          startCursor,
          endCursor,
          hasNextPage: endCursor !== sorted[sorted.length - 1].id,
          hasPreviousPage: startCursor !== sorted[0].id
        },
        this._authors.length
      ]
    } else {
      return [
        paginated,
        {startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false},
        this._authors.length
      ]
    }
  }

  // Article
  // =======

  async createArticle(id: string, input: ArticleInput): Promise<Article> {
    const articleVersion: MemoryArticleVersion = {
      ...input,
      id,
      state: VersionState.Draft,
      version: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this._articles.push({
      id,
      createdAt: articleVersion.createdAt,
      updatedAt: articleVersion.updatedAt,
      versions: [articleVersion]
    })

    return {
      id,
      createdAt: articleVersion.createdAt,
      updatedAt: articleVersion.updatedAt,
      latestVersion: 0
    }
  }

  async createArticleVersion(id: string, input: ArticleInput) {
    const article = this._articles.find(article => article.id === id)
    if (!article) return null

    article.versions.push({
      ...input,
      id,
      state: VersionState.Draft,
      version: article.versions.length,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return this.getArticle(id)
  }

  async updateArticleVersion(id: string, version: number, input: ArticleInput) {
    const article = this._articles.find(article => article.id === id)
    if (!article) return null

    const articleVersion = article.versions[version]
    if (!articleVersion) return null

    article.versions[version] = {
      ...articleVersion,
      ...input,
      id,
      version,
      updatedAt: new Date()
    }

    return this.getArticle(id)
  }

  async publishArticleVersion(
    id: string,
    version: number,
    publishedAt: Date,
    updatedAt: Date
  ): Promise<Article | null> {
    const article = this._articles.find(article => article.id === id)
    if (!article) return null

    const articleVersion = article.versions[version]

    if (!articleVersion) return null

    article.publishedVersion = version
    article.publishedAt = publishedAt
    article.updatedAt = updatedAt

    article.versions[version] = {
      ...articleVersion,
      id,
      version,
      state: VersionState.Published,
      updatedAt: new Date()
    }

    return this.getArticle(id)
  }

  async unpublishArticle(id: string): Promise<Article | null> {
    const article = this._articles.find(article => article.id === id)
    if (!article) return null

    article.publishedAt = undefined
    article.publishedVersion = undefined

    return this.getArticle(id)
  }

  async deleteArticle(deleteID: string): Promise<boolean | null> {
    const index = this._articles.findIndex(({id}) => id === deleteID)

    if (index !== -1) {
      this._articles.splice(index, 1)
      return true
    }

    return null
  }

  async getArticles(filter: string | undefined, args: ArticlesArguments): Promise<Article[]> {
    const articles = this._articles.map(article => {
      return {
        id: article.id,
        peer: article.peer,

        createdAt: article.createdAt,
        updatedAt: article.updatedAt,
        publishedAt: article.publishedAt,
        publishedVersion: article.publishedVersion,
        latestVersion: article.versions.length - 1
      }
    })

    return args.limit ? articles.slice(0, args.limit) : articles
  }

  async getArticle(id: string): Promise<Article | null> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return null

    return {
      id: article.id,
      peer: article.peer,

      createdAt: article.createdAt,
      updatedAt: article.updatedAt,
      publishedAt: article.publishedAt,

      publishedVersion: article.publishedVersion,
      latestVersion: article.versions.length - 1
    }
  }

  async getArticleVersion(id: string, version: number): Promise<ArticleVersion | null> {
    const article = this._articles.find(article => article.id === id)

    if (!article) return null

    const articleVersion = article.versions[version]
    if (!articleVersion) return null

    return {...articleVersion, id, version}
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

  async createPage(id: string, input: PageInput): Promise<Page> {
    const pageVersion = {
      ...input,
      id,
      version: 0,
      state: VersionState.Draft,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this._pages.push({
      id,
      createdAt: pageVersion.createdAt,
      updatedAt: pageVersion.updatedAt,
      versions: [pageVersion]
    })

    return {
      id,
      createdAt: pageVersion.createdAt,
      updatedAt: pageVersion.updatedAt,
      latestVersion: 0
    }
  }

  async createPageVersion(id: string, input: PageInput) {
    const page = this._pages.find(page => page.id === id)
    if (!page) return null

    page.versions.push({
      ...input,
      id,
      state: VersionState.Draft,
      version: page.versions.length,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    return this.getPage(id)
  }

  async updatePageVersion(id: string, version: number, input: PageInput) {
    const page = this._pages.find(page => page.id === id)
    if (!page) return null

    const pageVersion = page.versions[version]

    page.versions[version] = {
      ...pageVersion,
      ...input,
      updatedAt: new Date()
    }

    return this.getPage(id)
  }

  async publishPageVersion(
    id: string,
    version: number,
    publishedAt: Date,
    updatedAt: Date
  ): Promise<Page | null> {
    const page = this._pages.find(page => page.id === id)
    if (!page) return null

    const pageVersion = page.versions[version]
    if (!pageVersion) return null

    page.publishedVersion = version
    page.publishedAt = publishedAt
    page.updatedAt = updatedAt

    page.versions[version] = {
      ...pageVersion,
      id,
      version,
      state: VersionState.Published,
      updatedAt: new Date()
    }

    return this.getPage(id)
  }

  async unpublishPage(id: string): Promise<Page | null> {
    const page = this._pages.find(page => page.id === id)
    if (!page) return null

    page.publishedAt = undefined
    page.publishedVersion = undefined

    return this.getPage(id)
  }

  async deletePage(deleteID: string): Promise<boolean | null> {
    const index = this._pages.findIndex(({id}) => id === deleteID)

    if (index !== -1) {
      this._pages.splice(index, 1)
      return true
    }

    return null
  }

  async getPages(): Promise<Page[]> {
    const pages = this._pages.map(page => {
      return {
        id: page.id,
        createdAt: page.createdAt,
        updatedAt: page.updatedAt,
        publishedAt: page.publishedAt,
        publishedVersion: page.publishedVersion,
        latestVersion: page.versions.length - 1
      }
    })

    return pages
  }

  async getPage(id: string | undefined, slug?: string): Promise<Page | null> {
    if (id == null && slug == null) return null

    const page = this._pages.find(page => {
      if (slug != undefined && page.publishedVersion != undefined) {
        const publishedVersion = page.versions[page.publishedVersion]

        if (publishedVersion) {
          return (id != null ? page.id === id : true) && publishedVersion.slug === slug
        }

        return false
      } else {
        return page.id === id
      }
    })

    if (!page) return null

    return {
      id: page.id,

      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      publishedAt: page.publishedAt,

      publishedVersion: page.publishedVersion,
      latestVersion: page.versions.length - 1
    }
  }

  async getPageVersion(id: string, version: number): Promise<PageVersion | null> {
    const page = this._pages.find(page => page.id === id)

    if (!page) return null

    const pageVersion = page.versions[version]
    return {...pageVersion, id, version}
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
