import {User, Session} from './user'
import {Navigation} from './navigation'
import {PageInput, Page, PageVersion} from './page'
import {ArticleInput, Article, ArticlesArguments, ArticleVersion} from './article'
import {Peer, PeerArguments, PeersArguments} from './peer'
import {Image, ImageUpdate} from './image'
import {Author} from './author'
import {PageInfo, Pagination} from './pageInfo'

export interface StorageAdapter {
  // User
  // ====

  createUser(id: string, email: string, password: string): Promise<User>
  getUserForCredentials(email: string, password: string): Promise<User | null>

  // Session
  // =======

  createSession(user: User, token: string, expiryDate: Date): Promise<Session>
  getSession(token: string): Promise<Session | null>
  deleteSession(token: string): Promise<void>
  cleanSessions(): Promise<void>

  // Navigation
  // ==========

  createNavigation(navigation: Navigation): Promise<Navigation>
  getNavigation(key: string): Promise<Navigation | null>

  // Page
  // ====

  createPage(id: string, input: PageInput): Promise<Page>
  createPageVersion(id: string, input: PageInput): Promise<Page | null>
  updatePageVersion(id: string, version: number, input: PageInput): Promise<Page | null>

  getPages(): Promise<Page[]>
  getPage(id: string | undefined, slug?: string): Promise<Page | null>

  getPageVersion(id: string, version: number): Promise<PageVersion | null>
  getPageVersions(id: string): Promise<PageVersion[]>

  // Articles
  // ========

  createArticle(id: string, input: ArticleInput): Promise<Article>
  createArticleVersion(id: string, input: ArticleInput): Promise<Article | null>
  updateArticleVersion(id: string, version: number, input: ArticleInput): Promise<Article | null>

  getArticles(args: ArticlesArguments): Promise<Article[]>
  getArticle(id: string): Promise<Article | null>

  getArticleVersion(id: string, version: number): Promise<ArticleVersion | null>
  getArticleVersions(id: string): Promise<ArticleVersion[]>

  // Author
  // ======

  createAuthor(author: Author): Promise<Author>
  updateAuthor(author: Author): Promise<Author | null>
  deleteAuthor(id: string): Promise<Author | null>
  getAuthor(id: string): Promise<Author | null>
  getAuthors(pagination: Pagination): Promise<[Author[], PageInfo, number]>

  // Image
  // =====

  createImage(image: Image): Promise<Image>
  updateImage(image: ImageUpdate): Promise<Image | null>
  getImage(id: string): Promise<Image | null>
  getImages(pagination: Pagination): Promise<[Image[], PageInfo, number]>

  // Peers
  // =====

  createPeer(id: string, args: any): Promise<Peer>

  getPeer(args: PeerArguments): Promise<Peer | null>
  getPeers(args: PeersArguments): Promise<Peer[]>
}
