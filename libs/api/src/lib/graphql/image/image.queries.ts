import { Image, Prisma, PrismaClient } from '@prisma/client';
import { ConnectionResult } from '../../db/common';
import { ImageFilter, ImageSort } from '../../db/image';
import {
  SortOrder,
  getMaxTake,
  graphQLSortOrderToPrisma,
} from '@wepublish/utils/api';

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

export const getImages = async (
  filter: Partial<ImageFilter>,
  sortedField: ImageSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  image: PrismaClient['image']
): Promise<ConnectionResult<Image>> => {
  const orderBy = createImageOrder(sortedField, order);
  const where = createImageFilter(filter);

  const [totalCount, images] = await Promise.all([
    image.count({
      where,
      orderBy,
    }),
    image.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
      include: {
        focalPoint: true,
      },
    }),
  ]);

  const nodes = images.slice(0, getMaxTake(take));
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
};
