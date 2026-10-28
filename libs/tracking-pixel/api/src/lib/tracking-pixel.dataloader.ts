import { NamespacedCache } from '@wepublish/kv-ttl-cache/api';
import {
  CONTENT_CACHE_TTL_SECONDS,
  contentCacheNamespace,
} from '@wepublish/public-content-cache/api';
import { DataLoaderService } from '@wepublish/utils/api';
import {
  ArticleTrackingPixels,
  PrismaClient,
  TrackingPixelMethod,
} from '@prisma/client';
import { Injectable, Scope } from '@nestjs/common';
import { groupBy } from 'ramda';

@Injectable({
  scope: Scope.REQUEST,
})
export class TrackingPixelDataloader extends DataLoaderService<
  Array<ArticleTrackingPixels & { trackingPixelMethod: TrackingPixelMethod }>
> {
  constructor(
    private prisma: PrismaClient,
    private kv: NamespacedCache
  ) {
    super();
  }

  protected loadByKeys(articleIds: string[]) {
    return this.kv.getOrLoadManyNs(
      contentCacheNamespace('articles'),
      articleIds,
      missing => this.loadFromDatabase(missing),
      CONTENT_CACHE_TTL_SECONDS,
      'tracking-pixels:'
    );
  }

  private async loadFromDatabase(articleIds: string[]) {
    const trackingPixels = groupBy(
      property => property.articleId!,
      await this.prisma.articleTrackingPixels.findMany({
        where: {
          articleId: {
            in: articleIds,
          },
        },
        include: {
          trackingPixelMethod: true,
        },
      })
    );

    return articleIds.map(revisionId => trackingPixels[revisionId] ?? []);
  }
}
