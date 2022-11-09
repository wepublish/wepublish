import {PublicArticle} from './db/article'
import {PublicPage} from './db/page'
import {Author} from './db/author'
import {PublicComment} from './db/comment'
import {Newsroom} from '@prisma/client'

export interface URLAdapter {
  getPublicArticleURL(article: PublicArticle): string
  getPeeredArticleURL(newsroom: Newsroom, article: PublicArticle): string
  getPublicPageURL(page: PublicPage): string
  getAuthorURL(author: Author): string
  getArticlePreviewURL(token: string): string
  getPagePreviewURL(token: string): string
  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment): string
  getLoginURL(token: string): string
}
