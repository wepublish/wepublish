import {User, Session} from './user'
import {Navigation} from './navigation'
import {PageInput, Page, PageVersion} from './page'
import {ArticleInput, Article, ArticlesArguments, ArticleVersion} from './article'
import {PageBlock, ArticleBlock} from './blocks'
import {Peer, PeerArguments, PeersArguments} from './peer'
import {Image, ImageUpdate} from './image'
import {Author} from './author'

export interface StorageAdapter {
  // User
  getUserForCredentials(email: string, password: string): Promise<User | null>

  // Session
  createSession(user: User, token: string, expiryDate: Date): Promise<Session>
  deleteSession(user: User, token: string): Promise<Session | null>
  getSession(token: string): Promise<Session | null>

  // Navigation
  createNavigation(navigation: Navigation): Promise<Navigation>
  getNavigation(key: string): Promise<Navigation | null>

  // Page
  createPage(article: PageInput): Promise<Page>
  getPage(id: string): Promise<Page | null>
  getPageBySlug(slug: string): Promise<Page | null>

  getPageVersion(id: string, version: number): Promise<PageVersion | null>
  getPageVersions(id: string): Promise<PageVersion[]>
  getPageVersionBlocks(id: string, version: number): Promise<PageBlock[]>

  // Articles
  createArticle(article: ArticleInput): Promise<Article>

  getArticles(args: ArticlesArguments): Promise<Article[]>
  getArticle(id: string): Promise<Article | null>

  getArticleVersion(id: string, version: number): Promise<ArticleVersion | null>
  getArticleVersions(id: string): Promise<ArticleVersion[]>
  getArticleVersionBlocks(id: string, version: number): Promise<ArticleBlock[]>

  // Author
  createAuthor(author: Author): Promise<Author>
  getAuthor(id: string): Promise<Author | null>

  // Image
  createImage(image: Image): Promise<Image>
  updateImage(image: ImageUpdate): Promise<Image | null>
  getImage(id: string): Promise<Image | null>
  getImages(offset: number, limit: number): Promise<[number, Image[]]>

  // Peers
  createPeer(id: string, args: any): Promise<Peer>

  getPeer(args: PeerArguments): Promise<Peer | null>
  getPeers(args: PeersArguments): Promise<Peer[]>
}
