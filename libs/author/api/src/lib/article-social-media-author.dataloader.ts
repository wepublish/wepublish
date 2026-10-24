import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import {
  CONTENT_CACHE_TTL_SECONDS,
  contentCacheNamespace,
} from '@wepublish/public-content-cache/api';
import { DataLoaderService } from '@wepublish/utils/api';
import { Author, PrismaClient } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class ArticleSocialMediaAuthorDataloader extends DataLoaderService<
  Author[]
> {
  constructor(
    private prisma: PrismaClient,
    private kv: NamespacedCache
  ) {
    super();
  }

  protected loadByKeys(articleRevisionIds: string[]) {
    return this.kv.getOrLoadManyNs(
      contentCacheNamespace('authors'),
      articleRevisionIds,
      missing => this.loadFromDatabase(missing),
      CONTENT_CACHE_TTL_SECONDS,
      'social-media-authors:'
    );
  }

  private async loadFromDatabase(articleRevisionIds: string[]) {
    const authors = groupBy(
      author => author.revisionId!,
      await this.prisma.articleRevisionSocialMediaAuthor.findMany({
        relationLoadStrategy: 'join',
        where: {
          revisionId: {
            in: articleRevisionIds,
          },
        },
        include: {
          author: {
            include: {
              links: true,
            },
          },
        },
      })
    );

    return articleRevisionIds.map(
      revisionId => authors[revisionId]?.map(author => author.author) ?? []
    );
  }
}
