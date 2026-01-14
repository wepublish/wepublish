import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { ImageDataloaderService } from './image-dataloader.service';
import {
  ImageFilter,
  ImageListArgs,
  ImageSort,
  UpdateImageInput,
  UploadImageInput,
} from './image.model';
import { ImageUploadService } from './image-upload.service';

@Injectable()
export class ImageService {
  constructor(
    private prisma: PrismaClient,
    private upload: ImageUploadService
  ) {}

  @PrimeDataLoader(ImageDataloaderService)
  async getImages({
    filter,
    cursorId,
    sort = ImageSort.CreatedAt,
    order = SortOrder.Descending,
    take = 10,
    skip,
  }: ImageListArgs) {
    const orderBy = createImageOrder(sort, order);
    const where = createImageFilter(filter ?? {});

    const [totalCount, images] = await Promise.all([
      this.prisma.image.count({
        where,
        orderBy,
      }),
      this.prisma.image.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = images.slice(0, take);
    const firstImage = nodes[0];
    const lastImage = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = images.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstImage?.id,
        endCursor: lastImage?.id,
      },
    };
  }

  @PrimeDataLoader(ImageDataloaderService)
  async updateImage({ id, focalPoint, ...input }: UpdateImageInput) {
    return this.prisma.image.update({
      where: {
        id,
      },
      data: {
        ...input,
        focalPoint: {
          upsert: {
            create: focalPoint ?? {},
            update: focalPoint ?? {},
          },
        },
      },
    });
  }

  @PrimeDataLoader(ImageDataloaderService)
  async createImage(input: UploadImageInput) {
    return this.upload.uploadImage(input);
  }

  async deleteImage(id: string) {
    return this.upload.deleteImage(id);
  }
}

export const createImageOrder = (
  field: ImageSort,
  sortOrder: SortOrder
): Prisma.ImageFindManyArgs['orderBy'] => {
  switch (field) {
    case ImageSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case ImageSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTitleFilter = (
  filter: Partial<ImageFilter>
): Prisma.ImageWhereInput => {
  if (filter?.title) {
    return {
      OR: [
        {
          title: {
            contains: filter.title,
            mode: 'insensitive',
          },
        },
        {
          filename: {
            contains: filter.title,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  return {};
};

const createTagsFilter = (
  filter: Partial<ImageFilter>
): Prisma.ImageWhereInput => {
  if (filter?.tags?.length) {
    return {
      tags: {
        hasSome: filter.tags,
      },
    };
  }

  return {};
};

export const createImageFilter = (
  filter: Partial<ImageFilter>
): Prisma.ImageWhereInput => ({
  AND: [createTitleFilter(filter), createTagsFilter(filter)],
});
