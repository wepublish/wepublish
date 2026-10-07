import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { DataLoaderService } from '@wepublish/utils/api';
import {
  Author,
  ArticleRevisionAuthor as PrismaArticleRevisionAuthor,
  PrismaClient,
} from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

export type ArticleRevisionAuthorWithAuthor = PrismaArticleRevisionAuthor & {
  author: Author;
};

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleAuthorDataloader extends DataLoaderService<
  ArticleRevisionAuthorWithAuthor[]
> {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {
    super();
  }

  protected loadByKeys(articleRevisionIds: string[]) {
    return this.kv.getOrLoadManyNs(
      contentCacheNamespace('authors'),
      articleRevisionIds,
      missing => this.loadFromDatabase(missing),
      CONTENT_CACHE_TTL_SECONDS,
      'revision-authors:'
    );
  }

  private async loadFromDatabase(articleRevisionIds: string[]) {
    const authors = groupBy(
      author => author.revisionId!,
      await this.prisma.articleRevisionAuthor.findMany({
        relationLoadStrategy: 'join',
        where: {
          revisionId: {
            in: articleRevisionIds,
          },
        },
        orderBy: {
          position: 'asc',
        },
        include: {
          author: true,
        },
      })
    );

    return articleRevisionIds.map(revisionId => authors[revisionId] ?? []);
  }
}
