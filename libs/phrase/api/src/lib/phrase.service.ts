import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { getMaxTake, SortOrder } from '@wepublish/utils/api';
import {
  ArticleService,
  ArticleSort,
  createArticleOrder,
} from '@wepublish/article/api';
import { createPageOrder, PageService, PageSort } from '@wepublish/page/api';
import { PhraseQueryArgs } from './phrase.model';

@Injectable()
export class PhraseService {
  constructor(
    private prisma: PrismaClient,
    private articleService: ArticleService,
    private pageService: PageService
  ) {}

  async queryPhrase({
    query,
    take = 10,
    skip = 0,
    pageSort = PageSort.PublishedAt,
    articleSort = ArticleSort.PublishedAt,
    order = SortOrder.Descending,
  }: PhraseQueryArgs) {
    const [articleIds, pageIds] = await Promise.all([
      this.articleService.performFullTextSearch(query),
      this.pageService.performPageFullTextSearch(query),
    ]);

    const [articles, pages] = await Promise.all([
      this.prisma.article.findMany({
        where: {
          id: {
            in: articleIds,
          },
        },
        orderBy: createArticleOrder(articleSort, order),
        skip,
        take: getMaxTake(take),
      }),

      this.prisma.page.findMany({
        where: {
          id: {
            in: pageIds,
          },
        },
        orderBy: createPageOrder(pageSort, order),
        skip,
        take: getMaxTake(take),
      }),
    ]);

    const firstArticle = articles[0];
    const lastArticle = articles[articles.length - 1];
    const articlesHasNextPage = articleIds.length > skip + articles.length;

    const firstPage = pages[0];
    const lastPage = pages[pages.length - 1];
    const pagesHasNextPage = pageIds.length > skip + pages.length;

    return {
      articles: {
        nodes: articles,
        totalCount: articleIds.length,
        pageInfo: {
          hasPreviousPage: Boolean(skip),
          hasNextPage: articlesHasNextPage,
          startCursor: firstArticle?.id,
          endCursor: lastArticle?.id,
        },
      },
      pages: {
        nodes: pages,
        totalCount: pageIds.length,
        pageInfo: {
          hasPreviousPage: Boolean(skip),
          hasNextPage: pagesHasNextPage,
          startCursor: firstPage?.id,
          endCursor: lastPage?.id,
        },
      },
    };
  }
}
