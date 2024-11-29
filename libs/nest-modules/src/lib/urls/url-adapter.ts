import {
  CommentItemType,
  Author,
  Article,
  Event,
  Subscription,
  Tag,
  TagType,
  Page,
  Comment
} from '@prisma/client'

export class URLAdapter {
  constructor(private websiteURL: string) {}

  async getSubscriptionURL(subscription: Subscription) {
    return `${this.websiteURL}/profile/subscription/${subscription.id}`
  }

  async getArticleUrl(article: Article) {
    return `${this.websiteURL}/a/${article.slug}`
  }

  async getPageUrl(page: Page) {
    return `${this.websiteURL}/${page.slug}`
  }

  async getAuthorURL(author: Author) {
    return `${this.websiteURL}/author/${author.slug}`
  }

  async getEventURL(event: Event) {
    return `${this.websiteURL}/event/${event.id}`
  }

  async getCommentURL(item: Article | Page, comment: Comment) {
    if (comment.itemType === CommentItemType.article) {
      return `${await this.getArticleUrl(item as Article)}#${comment.id}`
    }

    return `${await this.getPageUrl(item as Page)}#${comment.id}`
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
