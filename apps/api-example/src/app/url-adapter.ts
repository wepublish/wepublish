import {CommentItemType, Event, Peer} from '@prisma/client'
import {Author, PublicArticle, PublicComment, PublicPage, URLAdapter} from '@wepublish/api'

export interface ExampleURLAdapterProps {
  websiteURL: string
}

export class ExampleURLAdapter implements URLAdapter {
  readonly websiteURL: string

  constructor(props: ExampleURLAdapterProps) {
    this.websiteURL = props.websiteURL
  }

  getPublicArticleURL(article: PublicArticle): string {
    return `${this.websiteURL}/a/${article.id}/${article.slug}`
  }

  getPeeredArticleURL(peer: Peer, article: PublicArticle): string {
    return `${this.websiteURL}/p/${peer.id}/${article.id}`
  }

  getPublicPageURL(page: PublicPage): string {
    return `${this.websiteURL}/page/${page.id}/${page.slug}`
  }

  getAuthorURL(author: Author): string {
    return `${this.websiteURL}/author/${author.slug || author.id}`
  }

  getEventURL(event: Event): string {
    return `${this.websiteURL}/events/${event.id}`
  }

  getCommentURL(item: PublicArticle | PublicPage, comment: PublicComment, peer?: Peer) {
    if (comment.itemType === CommentItemType.article) {
      return `${this.websiteURL}/a/${item.id}/${item.slug}#${comment.id}`
    }

    if (comment.itemType === CommentItemType.peerArticle) {
      return `${this.websiteURL}/p/${peer?.id}/${item.id}#${comment.id}`
    }

    return `${this.websiteURL}/${item.slug}#${comment.id}`
  }

  getArticlePreviewURL(token: string) {
    return `${this.websiteURL}/a/preview/${token}`
  }

  getPagePreviewURL(token: string): string {
    return `${this.websiteURL}/${token}`
  }

  getLoginURL(token: string): string {
    return `${this.websiteURL}/login?jwt=${token}`
  }
}
