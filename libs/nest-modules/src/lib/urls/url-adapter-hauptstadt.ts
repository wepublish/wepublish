import { Injectable } from '@nestjs/common';
import { Article, PrismaClient } from '@prisma/client';
import DataLoader from 'dataloader';
import { URLAdapter } from './url-adapter';

export const ARCHIVED_TAG = 'archiviert';
export const NACHTLEBEN_TAG = 'nachtleben';
export const AUSGANG_PATH = '/ausgang-in-bern';

type UrlTagFlags = {
  archived: boolean;
  nachtleben: boolean;
};

@Injectable()
export class HauptstadtURLAdapter extends URLAdapter {
  // the adapter is a singleton, so the loader disables caching and only
  // batches lookups happening in the same tick (e.g. all teasers of a page)
  private tagFlagsLoader = new DataLoader<string, UrlTagFlags>(
    async articleIds => {
      const rows = await this.prisma.taggedArticles.findMany({
        where: {
          articleId: { in: [...articleIds] },
          tag: {
            tag: { in: [ARCHIVED_TAG, NACHTLEBEN_TAG], mode: 'insensitive' },
          },
        },
        select: {
          articleId: true,
          tag: { select: { tag: true } },
        },
      });

      const flagsById = new Map<string, UrlTagFlags>();
      for (const { articleId, tag } of rows) {
        const flags = flagsById.get(articleId) ?? {
          archived: false,
          nachtleben: false,
        };
        if (tag.tag?.toLowerCase() === ARCHIVED_TAG) flags.archived = true;
        if (tag.tag?.toLowerCase() === NACHTLEBEN_TAG) flags.nachtleben = true;
        flagsById.set(articleId, flags);
      }

      return articleIds.map(
        articleId =>
          flagsById.get(articleId) ?? { archived: false, nachtleben: false }
      );
    },
    { cache: false }
  );

  constructor(
    baseURL: string,
    private prisma: PrismaClient
  ) {
    super(baseURL);
  }

  override async getArticleUrl(article: Article) {
    const { archived, nachtleben } = await this.tagFlagsLoader.load(article.id);

    if (archived && article.slug) {
      return `${this.baseURL}/archive/${article.slug}?articleId=${article.id}`;
    }

    // the current (non-archived) nachtleben article is only ever shown on the
    // ausgang-in-bern page — link straight there instead of via the redirect
    // that /a/<slug> would answer with
    if (nachtleben) {
      return `${this.baseURL}${AUSGANG_PATH}`;
    }

    return `${this.baseURL}/a/${article.slug}?articleId=${article.id}`;
  }

  override async getArticlePreviewUrl(article: Article) {
    const { archived } = await this.tagFlagsLoader.load(article.id);

    // previews must stay on the article route — the ausgang-in-bern page always
    // renders the published current article, never the previewed draft
    const url =
      archived && article.slug ?
        `${this.baseURL}/archive/${article.slug}?articleId=${article.id}`
      : `${this.baseURL}/a/${article.slug}?articleId=${article.id}`;

    return `${url}&preview`;
  }
}
