import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, Tag } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleTagDataloader extends DataLoaderService<Tag[]> {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {
    super();
  }

  protected loadByKeys(articleIds: string[]) {
    return this.kv.getOrLoadManyNs(
      contentCacheNamespace('articles'),
      articleIds,
      missing => this.loadFromDatabase(missing),
      CONTENT_CACHE_TTL_SECONDS,
      'tags:'
    );
  }

  private async loadFromDatabase(articleIds: string[]) {
    const tags = groupBy(
      tag => tag.articleId!,
      await this.prisma.taggedArticles.findMany({
        where: {
          articleId: {
            in: articleIds,
          },
        },
        include: {
          tag: true,
        },
      })
    );

    return articleIds.map(
      articleId => tags[articleId]?.map(tag => tag.tag) ?? []
    );
  }
}
