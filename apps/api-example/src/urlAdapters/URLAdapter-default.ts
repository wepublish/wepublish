import {Author, PublicArticle, PublicComment, PublicPage, URLAdapter} from '@wepublish/api'
import {CommentItemType, Peer, Event, Subscription} from '@prisma/client'

interface StandardURLAdapterProps {
  websiteURL: string
}

export class DefaultURLAdapter implements URLAdapter {
  readonly websiteURL: string

  constructor(props: StandardURLAdapterProps) {
    this.websiteURL = props.websiteURL
  }

  getSubscriptionURL(subscription: Subscription): string {
    return `${this.websiteURL}/profile/subscription/${subscription.id}`
  }

  getPublicArticleURL(article: PublicArticle): string {
    return `${this.websiteURL}/a/${article.id}/${article.slug}`
  }

  getPeeredArticleURL(peer: Peer, article: PublicArticle): string {
    return `${this.websiteURL}/peer/${peer.slug}/${article.id}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/p/${page.id}/${page.slug}`
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

  getArticlePreviewURL(token: string) {
    return `${this.websiteURL}/a/preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `${this.websiteURL}/p/preview/${token}`
  }

  getLoginURL(token: string): string {
    return `${this.websiteURL}/login/?jwt=${token}`
  }
}
