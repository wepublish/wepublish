import {PublicArticle, PublicArticleUrlArgs} from './db/article'
import {PublicPage, PublicPageUrlArgs} from './db/page'
import {Author} from './db/author'
import {PublicComment} from './db/comment'
import {Peer} from './db/peer'

export interface URLAdapter {
  getPublicArticleURL(article: PublicArticleUrlArgs): string
  getPeeredArticleURL(peer: Peer, article: PublicArticle): string
  getPublicPageURL(page: PublicPageUrlArgs): string
  getAuthorURL(author: Author): string
  getArticlePreviewURL(token: string): string
  getPagePreviewURL(token: string): string
  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment): string
  getLoginURL(token: string): string
}
