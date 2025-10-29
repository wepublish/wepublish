import { Prisma, PrismaClient } from '@prisma/client';
import { CanGetPoll } from '@wepublish/permissions';
import {
  SortOrder,
  getMaxTake,
  graphQLSortOrderToPrisma,
} from '@wepublish/utils/api';
import { Context } from '../../context';
import { authorise } from '../permissions';

export type PollFilter = {
  openOnly: boolean;
};

export enum PollSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  OpensAt = 'OpensAt',
}

export const createPollOrder = (
  field: PollSort,
  sortOrder: SortOrder
): Prisma.PollFindManyArgs['orderBy'] => {
  switch (field) {
    case PollSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case PollSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case PollSort.OpensAt:
    default:
      return {
        opensAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createOpenOnlyFilter = (
  filter?: Partial<PollFilter>
): Prisma.PollWhereInput => {
  if (filter?.openOnly) {
    return {
      opensAt: {
        lte: new Date(),
      },
      OR: [
        {
          closedAt: null,
        },
        {
          closedAt: {
            gte: new Date(),
          },
        },
      ],
    };
  }

  return {};
};

export const createPollFilter = (
  filter?: Partial<PollFilter>
): Prisma.PollWhereInput => ({
  AND: [createOpenOnlyFilter(filter)],
});

export const getPolls = async (
  filter: Partial<PollFilter>,
  sortedField: PollSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  poll: PrismaClient['poll']
) => {
  const { roles } = authenticate();
  authorise(CanGetPoll, roles);

  const orderBy = createPollOrder(sortedField, order);
  const where = createPollFilter(filter);

  const [totalCount, polls] = await Promise.all([
    poll.count({
      where,
      orderBy,
    }),
    poll.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
      include: {
        answers: true,
      },
    }),
  ]);

  const nodes = polls.slice(0, take);
  const firstPoll = nodes[0];
  const lastPoll = nodes[nodes.length - 1];

  const hasPreviousPage = Boolean(skip);
  const hasNextPage = polls.length > nodes.length;

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstPoll?.id,
      endCursor: lastPoll?.id,
    },
  };
};
