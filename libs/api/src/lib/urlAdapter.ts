import {PublicArticle} from './db/article'
import {PublicPage} from './db/page'
import {Author} from './db/author'
import {PublicComment} from './db/comment'
import {Event, Peer} from '@prisma/client'

export interface URLAdapter {
  getPublicArticleURL(article: PublicArticle): string
  getPeeredArticleURL(peer: Peer, article: PublicArticle): string
  getPublicPageURL(page: PublicPage): string
  getAuthorURL(author: Author): string
  getEventURL(event: Event): string
  getArticlePreviewURL(token: string): string
  getPagePreviewURL(token: string): string
  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment, peer?: Peer): string
  getLoginURL(token: string): string
}
