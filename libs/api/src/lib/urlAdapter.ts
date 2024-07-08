import {PublicArticle} from './db/article'
import {PublicPage} from './db/page'
import {Author} from './db/author'
import {PublicComment} from './db/comment'
import {Event, Peer, Subscription, Tag} from '@prisma/client'

export interface URLAdapter {
  getPublicArticleURL(article: PublicArticle): Promise<string>
  getPeeredArticleURL(peer: Peer, article: PublicArticle): Promise<string>
  getPublicPageURL(page: PublicPage): Promise<string>
  getAuthorURL(author: Author): Promise<string>
  getEventURL(event: Event): Promise<string>
  getArticlePreviewURL(token: string): Promise<string>
  getPagePreviewURL(token: string): Promise<string>
  getCommentURL(
    item: PublicArticle | PublicPage,
    comment: PublicComment,
    peer?: Peer
  ): Promise<string>
  getLoginURL(token: string): string
  getSubscriptionURL(subscription: Subscription): Promise<string>
  getTagURL(tag: Tag): Promise<string>
}
