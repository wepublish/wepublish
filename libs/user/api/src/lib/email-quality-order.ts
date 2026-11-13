import { EmailQualityLevel, Prisma } from '@prisma/client';
import { graphQLSortOrderToPrisma, SortOrder } from '@wepublish/utils/api';

/** One stretch of an ordered list: who belongs to it, and their order within. */
export type OrderedSlice = {
  where: Prisma.UserWhereInput;
  orderBy: Prisma.UserOrderByWithRelationInput[];
};

/*
 * Why slices instead of a plain `orderBy: { emailQuality: { level } }`:
 * most users have no UserEmailQuality row. The LEFT JOIN makes them NULL and
 * Postgres sorts NULLs first when descending, so "worst first" would open on
 * thousands of never-evaluated people instead of the dead addresses. Prisma
 * offers no `nulls: 'last'` through a relation, and the list filter is a
 * Prisma `where`, so raw SQL would mean rebuilding it. Ordering by slices
 * puts the never-evaluated exactly where their label says: among `unknown`.
 */

const LEVELS_BEST_TO_WORST = [
  EmailQualityLevel.active,
  EmailQualityLevel.unknown,
  EmailQualityLevel.unresponsive,
  EmailQualityLevel.dead,
] as const;

/** Users by email status, best to worst ascending; ties by id. */
export const emailQualitySlices = (order: SortOrder): OrderedSlice[] => {
  const direction = graphQLSortOrderToPrisma(order);
  const slices = LEVELS_BEST_TO_WORST.map((level): OrderedSlice => ({
    where:
      level === EmailQualityLevel.unknown ?
        {
          OR: [
            { emailQuality: { is: { level } } },
            { emailQuality: { is: null } },
          ],
        }
      : { emailQuality: { is: { level } } },
    orderBy: [{ id: direction }],
  }));

  return order === SortOrder.Ascending ? slices : slices.reverse();
};

/** Users by when their email status was reached; people without one last either way. */
export const emailQualitySinceSlices = (order: SortOrder): OrderedSlice[] => {
  const direction = graphQLSortOrderToPrisma(order);

  return [
    {
      where: { emailQuality: { isNot: null } },
      orderBy: [{ emailQuality: { since: direction } }, { id: direction }],
    },
    {
      where: { emailQuality: { is: null } },
      orderBy: [{ id: direction }],
    },
  ];
};

/**
 * One page of `where`, ordered slice after slice. The slices must not
 * overlap; together they should cover everyone, as the total is their sum.
 * Only slices holding rows of the page are queried.
 */
export const findAcrossSlices = async <T>(
  where: Prisma.UserWhereInput,
  slices: OrderedSlice[],
  { skip, take }: { skip: number; take: number },
  count: (where: Prisma.UserWhereInput) => Promise<number>,
  find: (args: {
    where: Prisma.UserWhereInput;
    orderBy: Prisma.UserOrderByWithRelationInput[];
    skip: number;
    take: number;
  }) => Promise<T[]>
): Promise<{ nodes: T[]; totalCount: number }> => {
  const scoped = slices.map(slice => ({
    ...slice,
    where: { AND: [where, slice.where] },
  }));
  const counts = await Promise.all(scoped.map(slice => count(slice.where)));
  const nodes: T[] = [];
  let toSkip = skip;

  for (const [index, slice] of scoped.entries()) {
    const toTake = take - nodes.length;

    if (toTake <= 0) {
      break;
    }

    if (toSkip >= counts[index]) {
      toSkip -= counts[index];
      continue;
    }

    nodes.push(
      ...(await find({
        where: slice.where,
        orderBy: slice.orderBy,
        skip: toSkip,
        take: toTake,
      }))
    );
    toSkip = 0;
  }

  return { nodes, totalCount: counts.reduce((sum, n) => sum + n, 0) };
};
