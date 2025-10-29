import { Comment, Prisma, PrismaClient } from '@prisma/client';
import { CommentFilter, CommentSort } from '../../db/comment';
import { ConnectionResult } from '../../db/common';
import {
  SortOrder,
  getMaxTake,
  graphQLSortOrderToPrisma,
} from '@wepublish/utils/api';

export const createCommentOrder = (
  field: CommentSort,
  sortOrder: SortOrder
): Prisma.CommentFindManyArgs['orderBy'] => {
  switch (field) {
    case CommentSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case CommentSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTagFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.tags?.length) {
    return {
      tags: {
        some: {
          tagId: {
            in: filter?.tags,
          },
        },
      },
    };
  }

  return {};
};

const createStateFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.states) {
    return {
      state: {
        in: filter.states,
      },
    };
  }

  return {};
};

const createItemFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.item) {
    return {
      itemID: filter.item,
    };
  }

  return {};
};

const createItemTypeFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter?.itemType) {
    return {
      itemType: {
        equals: filter.itemType,
      },
    };
  }

  return {};
};

const createItemIdFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => {
  if (filter.itemID) {
    return {
      itemID: {
        equals: filter.itemID,
      },
    };
  }

  return {};
};

export const createCommentFilter = (
  filter: Partial<CommentFilter>
): Prisma.CommentWhereInput => ({
  AND: [
    createStateFilter(filter),
    createTagFilter(filter),
    createItemTypeFilter(filter),
    createItemIdFilter(filter),
    createItemFilter(filter),
  ],
});

export const getComments = async (
  filter: Partial<CommentFilter>,
  sortedField: CommentSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  comment: PrismaClient['comment']
): Promise<ConnectionResult<Comment>> => {
  const orderBy = createCommentOrder(sortedField, order);
  const where = createCommentFilter(filter);

  const [totalCount, comments] = await Promise.all([
    comment.count({
      where,
      orderBy,
    }),
    comment.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
      include: {
        revisions: { orderBy: { createdAt: 'asc' } },
      },
    }),
  ]);

  const nodes = comments.slice(0, take);
  const firstComment = nodes[0];
  const lastComment = nodes[nodes.length - 1];

  const hasPreviousPage = Boolean(skip);
  const hasNextPage = comments.length > nodes.length;

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstComment?.id,
      endCursor: lastComment?.id,
    },
  };
};
