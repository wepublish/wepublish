import {PublicArticle} from './db/article'
import {PublicPage} from './db/page'
import {Author} from './db/author'
import {PublicComment} from './db/comment'

export interface URLAdapter {
  getPublicArticleURL(article: PublicArticle): string
  getPublicPageURL(page: PublicPage): string
  getAuthorURL(author: Author): string
  getArticlePreviewURL(token: string): string
  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment): string
}
