import { Injectable } from '@nestjs/common';
import { Article, Page } from '@prisma/client';
import { URLAdapter } from './url-adapter';

const locales = ['de', 'fr'];

@Injectable()
export class WepublishSiteURLAdapter extends URLAdapter {
  constructor() {
    super('');
  }

  async getArticleUrl(article: Article) {
    for (const locale in locales) {
      if (article.slug?.endsWith(`-${locale}`)) {
        const regex = new RegExp(`-${locale}$`);

        return `/a/${article.slug.replace(regex, '')}`;
      }
    }

    return article.slug ? `/a/${article.slug}` : `/a/id/${article.id}`;
  }

  async getPageUrl(page: Page) {
    for (const locale in locales) {
      if (page.slug?.endsWith(`-${locale}`)) {
        const regex = new RegExp(`-${locale}$`);

        return `/a/${page.slug.replace(regex, '')}`;
      }
    }

    return page.slug || page.publishedAt ? `/${page.slug}` : `/id/${page.id}`;
  }
}
