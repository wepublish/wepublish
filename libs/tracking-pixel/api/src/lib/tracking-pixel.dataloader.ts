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
  constructor(private prisma: PrismaClient) {
    super();
  }

  protected async loadByKeys(articleIds: string[]) {
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
