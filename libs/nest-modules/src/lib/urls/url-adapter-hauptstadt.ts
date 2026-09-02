import { Injectable } from '@nestjs/common';
import { Article, Tag } from '@prisma/client';
import { URLAdapter } from './url-adapter';

export const ARCHIVED_TAG = 'archiviert';

@Injectable()
export class HauptstadtURLAdapter extends URLAdapter {
  override async getArticleUrl(article: Article, tags?: Tag[]) {
    const isArchived = tags?.some(
      ({ tag }) => tag?.toLowerCase() === ARCHIVED_TAG
    );

    if (isArchived && article.slug) {
      return `${this.baseURL}/arch/${article.slug}?articleId=${article.id}`;
    }

    return `${this.baseURL}/a/${article.slug}?articleId=${article.id}`;
  }

  override async getArticlePreviewUrl(article: Article, tags?: Tag[]) {
    return `${await this.getArticleUrl(article, tags)}&preview`;
  }
}
