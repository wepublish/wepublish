import {Author, PublicArticle, PublicComment, PublicPage, URLAdapter} from '@wepublish/api'
import {CommentItemType, Peer, Event, Subscription} from '@prisma/client'

interface BajourURLAdapterProps {
  websiteURL: string
  blocksHost: string
}

export class BajourURLAdapter implements URLAdapter {
  readonly websiteURL: string
  readonly blocksHost: string

  constructor(props: BajourURLAdapterProps) {
    this.websiteURL = props.websiteURL
    this.blocksHost = props.blocksHost
  }

  getSubscriptionURL(subscription: Subscription): string {
    return `${this.websiteURL}/profile/subscription/${subscription.id}`
  }

  getArticlePreviewURL(token: string) {
    return `${this.websiteURL}/a/preview/${token}`
  }

  getPublicArticleURL(article: PublicArticle): string {
    return `${this.websiteURL}/a/${article.id}/${article.slug}`
  }

  getPeeredArticleURL(peer: Peer, article: PublicArticle): string {
    return `${this.websiteURL}/p/${peer.id}/${article.id}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/author/${author.slug || author.id}`
  }

  getEventURL(event: Event): string {
    return `${this.websiteURL}/events/${event.id}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment) {
    if (comment.itemType === CommentItemType.article) {
      return `${this.websiteURL}/a/${item.id}/${item.slug}#${comment.id}`
    }

    return `${this.websiteURL}/${item.slug}#${comment.id}`
  }

  getPagePreviewURL(token: string): string {
    return `${this.websiteURL}/page/preview/${token}`
  }

  getLoginURL(token: string): string {
    return `${this.blocksHost}/profile/dashboard/?jwt=${token}`
  }
}
