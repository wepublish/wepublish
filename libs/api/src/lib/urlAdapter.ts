import {PublicArticle} from './db/article'
import {PublicComment} from './db/comment'
import {PublicPage} from './db/page'
import {Event, Peer, Subscription} from '@prisma/client'
import {Author} from '@wepublish/author/api'

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

  getSubscriptionURL(subscription: Subscription): string
}
