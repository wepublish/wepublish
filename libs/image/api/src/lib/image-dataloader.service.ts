import { Injectable, Scope } from '@nestjs/common';
import { FocalPoint, Image, PrismaClient } from '@prisma/client';
import { createOptionalsArray, Primeable } from '@wepublish/utils/api';
import DataLoader from 'dataloader';

export type ImageWithFocalPoint = Image & { focalPoint?: FocalPoint | null };

@Injectable({
  scope: Scope.REQUEST,
})
export class ImageDataloaderService implements Primeable<ImageWithFocalPoint> {
  private dataloader = new DataLoader<string, ImageWithFocalPoint | null>(
    async (ids: readonly string[]) =>
      createOptionalsArray(
        ids as string[],
        await this.prisma.image.findMany({
          where: {
            id: {
              in: ids as string[],
            },
          },
          include: {
            focalPoint: true,
          },
        }),
        'id'
      ),
    { name: 'ImageDataLoader' }
  );

  constructor(private prisma: PrismaClient) {}

  public prime(
    ...parameters: Parameters<
      DataLoader<string, ImageWithFocalPoint | null>['prime']
    >
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<
      DataLoader<string, ImageWithFocalPoint | null>['load']
    >
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<
      DataLoader<string, ImageWithFocalPoint | null>['loadMany']
    >
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
