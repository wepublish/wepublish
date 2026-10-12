import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { DataLoaderService } from '@wepublish/utils/api';
import { PrismaClient, AuthorsLinks } from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuthorLinkDataloader extends DataLoaderService<AuthorsLinks[]> {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {
    super();
  }

  protected loadByKeys(authorIds: string[]) {
    return this.kv.getOrLoadManyNs(
      contentCacheNamespace('authors'),
      authorIds,
      missing => this.loadFromDatabase(missing),
      CONTENT_CACHE_TTL_SECONDS,
      'links:'
    );
  }

  private async loadFromDatabase(authorIds: string[]) {
    const links = groupBy(
      link => link.authorId!,
      await this.prisma.authorsLinks.findMany({
        where: {
          authorId: {
            in: authorIds,
          },
        },
      })
    );

    return authorIds.map(authorId => links[authorId] ?? []);
  }
}
