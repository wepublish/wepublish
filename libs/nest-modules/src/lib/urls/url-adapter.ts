import { Injectable } from '@nestjs/common';
import {
  CommentItemType,
  Author,
  Article,
  Event,
  Subscription,
  Tag,
  TagType,
  Page,
  Comment,
} from '@prisma/client';

@Injectable()
export class URLAdapter {
  constructor(protected baseURL: string) {}

  async getSubscriptionURL(subscription: Subscription) {
    return `${this.baseURL}/profile/subscription/${subscription.id}`;
  }

  async getArticleUrl(article: Article) {
    return article.slug ?
        `${this.baseURL}/a/${article.slug}`
      : `${this.baseURL}/a/id/${article.id}`;
  }

  async getArticlePreviewUrl(article: Article) {
    return `${await this.getArticleUrl(article)}?preview`;
  }

  async getPageUrl(page: Page) {
    return page.slug || page.publishedAt ?
        `${this.baseURL}/${page.slug}`
      : `${this.baseURL}/id/${page.id}`;
  }

  async getPagePreviewUrl(page: Page) {
    return `${await this.getPageUrl(page)}?preview`;
  }

  async getAuthorURL(author: Pick<Author, 'id' | 'slug'>) {
    return `${this.baseURL}/author/${author.slug}`;
  }

  async getEventURL(event: Event) {
    return `${this.baseURL}/event/${event.id}`;
  }

  async getCommentURL(
    item: Article | Page,
    comment: Pick<Comment, 'id' | 'itemType'>
  ) {
    if (comment.itemType === CommentItemType.article) {
      return `${await this.getArticleUrl(item as Article)}#${comment.id}`;
    }

    return `${await this.getPageUrl(item as Page)}#${comment.id}`;
  }

  getLoginURL(token: string) {
    return `${this.baseURL}/login?jwt=${token}`;
  }

  async getTagURL(tag: Tag) {
    if (tag.tag && tag.type === TagType.Article) {
      return `${this.baseURL}/a/tag/${encodeURIComponent(tag.tag)}`;
    }

    return ``;
  }
}
