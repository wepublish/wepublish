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

  async getSubscriptionURL(subscription: Subscription) {
    return `${this.websiteURL}/profile/subscription/${subscription.id}`
  }

  async getPublicArticleURL(article: PublicArticle) {
    return `${this.websiteURL}/a/${article.slug}`
  }

  async getPeeredArticleURL(peer: Peer, article: PublicArticle) {
    return `${this.websiteURL}/p/${peer.id}/${article.id}`
  }

  async getPublicPageURL(page: PublicPage) {
    return `${this.websiteURL}/${page.slug}`
  }

  async getAuthorURL(author: Author) {
    return `${this.websiteURL}/author/${author.slug}`
  }

  async getEventURL(event: Event) {
    return `${this.websiteURL}/event/${event.id}`
  }

  async getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment, peer?: Peer) {
    if (comment.itemType === CommentItemType.article) {
      return `${await this.getPublicArticleURL(item as PublicArticle)}#${comment.id}`
    }

    if (comment.itemType === CommentItemType.peerArticle) {
      return `${await this.getPeeredArticleURL(peer, item as PublicArticle)}#${comment.id}`
    }

    return `${await this.getPublicPageURL(item as PublicPage)}#${comment.id}`
  }

  async getArticlePreviewURL(token: string) {
    return `${this.websiteURL}/a/preview/${token}`
  }

  async getPagePreviewURL(token: string) {
    return `${this.websiteURL}/preview/${token}`
  }

  getLoginURL(token: string) {
    return `${this.websiteURL}/login?jwt=${token}`
  }

  async getTagURL(tag: Tag) {
    if (tag.tag && tag.type === TagType.Article) {
      return `${this.websiteURL}/a/tag/${encodeURIComponent(tag.tag)}`
    }

    return ``
  }
}
