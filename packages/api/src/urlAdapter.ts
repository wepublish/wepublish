import {PublicArticle} from './db/article'
import {PublicPage} from './db/page'
import {Author} from './db/author'

export interface URLAdapter {
  getPublicArticleURL(article: PublicArticle): string
  getPublicPageURL(page: PublicPage): string
  getAuthorURL(author: Author): string
}
