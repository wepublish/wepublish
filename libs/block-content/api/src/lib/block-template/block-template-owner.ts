import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { SortOrder } from '@wepublish/utils/api';

/**
 * Helpers for models that own a block template 1:1 (article and page
 * templates), whose name lives on the block template.
 */

export enum TemplateSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Name = 'Name',
}

export type TemplateOrder =
  | { createdAt: Prisma.SortOrder }
  | { modifiedAt: Prisma.SortOrder }
  | { blockTemplate: { name: Prisma.SortOrder } };

export type TemplateFilter =
  | { AND: { blockTemplate: { name: Prisma.StringFilter } }[] }
  | Record<string, never>;

export function throwOnDuplicateName(error: unknown, name: string): never {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new BadRequestException(
      `A template with the name "${name}" already exists.`
    );
  }

  throw error;
}

export function createTemplateOrder(
  field: `${TemplateSort}`,
  sortOrder: SortOrder
): TemplateOrder {
  const direction = sortOrder === SortOrder.Ascending ? 'asc' : 'desc';

  switch (field) {
    case TemplateSort.CreatedAt:
      return { createdAt: direction };

    case TemplateSort.ModifiedAt:
      return { modifiedAt: direction };

    case TemplateSort.Name:
    default:
      return { blockTemplate: { name: direction } };
  }
}

export function createTemplateFilter(filter?: {
  name?: string | null;
}): TemplateFilter {
  if (!filter?.name) {
    return {};
  }

  return {
    AND: [
      {
        blockTemplate: {
          name: {
            mode: 'insensitive',
            contains: filter.name,
          },
        },
      },
    ],
  };
}
