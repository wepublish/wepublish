import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { Injectable, Scope } from '@nestjs/common';
import { Author, PrismaClient } from '@prisma/client';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class AuthorDataloaderService implements Primeable<Author> {
  private dataloader = new DataLoader<string, Author | null>(
    async (ids: readonly string[]) =>
      this.kv.getOrLoadManyNs(
        contentCacheNamespace('authors'),
        ids as string[],
        async missing =>
          createOptionalsArray(
            missing,
            await this.prisma.author.findMany({
              where: {
                id: {
                  in: missing,
                },
              },
            }),
            'id'
          ),
        CONTENT_CACHE_TTL_SECONDS,
        'id:'
      ),
    { name: 'AuthorDataLoader' }
  );

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, Author | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Author | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, Author | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
