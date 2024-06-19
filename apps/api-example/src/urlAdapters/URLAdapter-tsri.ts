import {Author, PublicArticle, PublicComment, PublicPage, URLAdapter} from '@wepublish/api'
import {CommentItemType, Peer, Event, Subscription} from '@prisma/client'

interface TsriURLAdapterProps {
  websiteURL: string
}

export class TsriURLAdapter implements URLAdapter {
  readonly websiteURL: string

  constructor(props: TsriURLAdapterProps) {
    this.websiteURL = props.websiteURL
  }

  getSubscriptionURL(subscription: Subscription): string {
    return `${this.websiteURL}/profile/subscription/${subscription.id}`
  }

  getPublicArticleURL(article: PublicArticle): string {
    return `${this.websiteURL}/zh/${article.slug}.${article.id}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/redaktion/${author.slug || author.id}`
  }

  getEventURL(event: Event): string {
    return `${this.websiteURL}/events/${event.id}`
  }

  getArticlePreviewURL(token: string): string {
    return `${this.websiteURL}/article_preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `${this.websiteURL}/preview/${token}` //TODO: implement
  }

  getLoginURL(token: string): string {
    return `${this.websiteURL}/login/?jwt=${token}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment) {
    if (comment.itemType === CommentItemType.article) {
      return `${this.websiteURL}/a/${item.id}/${item.slug}#${comment.id}`
    }
    return `${this.websiteURL}/${item.slug}#${comment.id}`
  }

  getPeeredArticleURL(peer: Peer, article: PublicArticle): string {
    return `${this.websiteURL}/peer/${peer.slug}/${article.id}`
  }
}
