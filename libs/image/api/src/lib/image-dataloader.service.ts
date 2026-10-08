import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { Injectable, Scope } from '@nestjs/common';
import { Image, PrismaClient } from '@prisma/client';
import { createOptionalsArray, Primeable } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class ImageDataloaderService implements Primeable<Image> {
  private dataloader = new DataLoader<string, Image | null>(
    async (ids: readonly string[]) =>
      this.kv.getOrLoadManyNs(
        contentCacheNamespace('images'),
        ids as string[],
        async missing =>
          createOptionalsArray(
            missing,
            await this.prisma.image.findMany({
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
    { name: 'ImageDataLoader' }
  );

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  public prime(
    ...parameters: Parameters<DataLoader<string, Image | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Image | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, Image | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
