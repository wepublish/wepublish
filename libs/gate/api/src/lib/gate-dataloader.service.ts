import {
  CONTENT_CACHE_TTL_SECONDS,
  KvTtlCacheService,
  contentCacheNamespace,
} from '@wepublish/kv-ttl-cache/api';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { GateWithActions } from './gate.service';
import { Primeable, createOptionalsArray } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

@Injectable({
  scope: Scope.REQUEST,
})
export class GateDataloaderService implements Primeable<GateWithActions> {
  private dataloader = new DataLoader<string, GateWithActions | null>(
    async (ids: readonly string[]) =>
      this.kv.getOrLoadManyNs(
        contentCacheNamespace('gates'),
        ids as string[],
        async missing =>
          createOptionalsArray(
            missing,
            await this.prisma.gate.findMany({
              where: {
                id: {
                  in: missing,
                },
              },
              include: { actions: true },
            }),
            'id'
          ),
        CONTENT_CACHE_TTL_SECONDS,
        'id:'
      ),
    { name: 'GateDataLoader' }
  );

  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService
  ) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, GateWithActions | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, GateWithActions | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, GateWithActions | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
