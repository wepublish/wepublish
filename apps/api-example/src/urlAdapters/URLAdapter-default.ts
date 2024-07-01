import {Author, PublicArticle, PublicComment, PublicPage, URLAdapter} from '@wepublish/api'
import {CommentItemType, Peer, Event, Subscription, Tag, TagType} from '@prisma/client'

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
    return `${this.websiteURL}/a/${article.slug}`
  }

  getPeeredArticleURL(peer: Peer, article: PublicArticle): string {
    return `${this.websiteURL}/p/${peer.id}/${article.id}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/author/${author.slug}`
  }

  getEventURL(event: Event): string {
    return `${this.websiteURL}/event/${event.id}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment, peer?: Peer) {
    if (comment.itemType === CommentItemType.article) {
      return `${this.getPublicArticleURL(item as PublicArticle)}#${comment.id}`
    }

    if (comment.itemType === CommentItemType.peerArticle) {
      return `${this.getPeeredArticleURL(peer, item as PublicArticle)}#${comment.id}`
    }

    return `${this.getPublicPageURL(item as PublicPage)}#${comment.id}`
  }

  getArticlePreviewURL(token: string) {
    return `${this.websiteURL}/a/preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `${this.websiteURL}/preview/${token}`
  }

  getLoginURL(token: string): string {
    return `${this.websiteURL}/login?jwt=${token}`
  }

  getTagURL(tag: Tag): string {
    if (tag.tag && tag.type === TagType.Article) {
      return `${this.websiteURL}/a/tag/${tag.tag}`
    }

    return ``
  }
}
