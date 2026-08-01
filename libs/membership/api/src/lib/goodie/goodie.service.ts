import { BadRequestException, Injectable } from '@nestjs/common';
import { Goodie, Prisma, PrismaClient } from '@prisma/client';
import { getMaxTake, PrimeDataLoader, SortOrder } from '@wepublish/utils/api';
import { GraphQLError } from 'graphql';
import { GoodieDataloader } from './goodie.dataloader';
import {
  CreateGoodieInput,
  GoodieFilter,
  GoodieListArgs,
  GoodieSort,
  UpdateGoodieInput,
} from './goodie.model';

const validateGoodie = ({ stock }: Pick<CreateGoodieInput, 'stock'>) => {
  if (stock != null && stock < 0) {
    throw new BadRequestException('stock can not be negative');
  }
};

@Injectable()
export class GoodieService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(GoodieDataloader)
  async getGoodies({
    filter,
    sort = GoodieSort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: GoodieListArgs) {
    const where = createGoodieFilter(filter);
    const orderBy = createGoodieOrder(sort, order);

    const [totalCount, goodies] = await Promise.all([
      this.prisma.goodie.count({
        where,
        orderBy,
      }),
      this.prisma.goodie.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = goodies.slice(0, getMaxTake(take));
    const firstGoodie = nodes[0];
    const lastGoodie = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = goodies.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstGoodie?.id,
        endCursor: lastGoodie?.id,
      },
    };
  }

  @PrimeDataLoader(GoodieDataloader)
  async createGoodie({ memberPlanIDs, ...input }: CreateGoodieInput) {
    validateGoodie(input);

    return this.prisma.goodie.create({
      data: {
        ...input,
        memberPlans: {
          connect: memberPlanIDs.map(id => ({ id })),
        },
      },
    });
  }

  @PrimeDataLoader(GoodieDataloader)
  async updateGoodie({ id, memberPlanIDs, ...input }: UpdateGoodieInput) {
    validateGoodie(input);

    return this.prisma.goodie.update({
      where: {
        id,
      },
      data: {
        ...input,
        memberPlans:
          memberPlanIDs ?
            {
              set: memberPlanIDs.map(memberPlanId => ({ id: memberPlanId })),
            }
          : undefined,
      },
    });
  }

  async deleteGoodie(id: string) {
    return this.prisma.goodie.delete({
      where: {
        id,
      },
    });
  }

  async getMemberPlansForGoodie(goodieId: string) {
    return this.prisma.goodie
      .findUnique({
        where: { id: goodieId },
      })
      .memberPlans();
  }

  async getClaimedCounts(goodieIds: string[]): Promise<Record<string, number>> {
    if (!goodieIds.length) {
      return {};
    }

    const counts = await this.prisma.invoiceItem.groupBy({
      by: ['goodieId'],
      where: {
        goodieId: {
          in: goodieIds,
        },
      },
      _count: {
        _all: true,
      },
    });

    return Object.fromEntries(
      counts.map(({ goodieId, _count }) => [goodieId, _count._all])
    );
  }

  async getAvailableStock(goodie: Goodie): Promise<number | null> {
    if (goodie.stock == null) {
      return null;
    }

    const claimed = await this.getClaimedCounts([goodie.id]);

    return Math.max(goodie.stock - (claimed[goodie.id] ?? 0), 0);
  }

  async getAvailableGoodiesForMemberPlan(memberPlanId: string) {
    const goodies = await this.prisma.goodie.findMany({
      where: {
        active: true,
        memberPlans: {
          some: {
            id: memberPlanId,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const claimed = await this.getClaimedCounts(
      goodies.filter(({ stock }) => stock != null).map(({ id }) => id)
    );

    return goodies.filter(
      ({ id, stock }) => stock == null || stock - (claimed[id] ?? 0) > 0
    );
  }

  async getValidGoodie(goodieId: string, memberPlanId: string) {
    const goodie = await this.prisma.goodie.findFirst({
      where: {
        id: goodieId,
        active: true,
        memberPlans: {
          some: {
            id: memberPlanId,
          },
        },
      },
    });

    if (!goodie) {
      throw new BadRequestException(
        'Goodie is not available for this member plan.'
      );
    }

    const availableStock = await this.getAvailableStock(goodie);

    if (availableStock != null && availableStock <= 0) {
      throw new GraphQLError('Goodie is sold out.', {
        extensions: {
          code: 'GOODIE_SOLD_OUT',
        },
      });
    }

    return goodie;
  }
}

function createGoodieOrder(
  field: GoodieSort,
  sortOrder: SortOrder
): Prisma.GoodieOrderByWithRelationInput {
  switch (field) {
    case GoodieSort.Name:
      return {
        name: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case GoodieSort.ModifiedAt:
      return {
        modifiedAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case GoodieSort.CreatedAt:
    default:
      return {
        createdAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };
  }
}

const createNameFilter = (
  filter?: Partial<GoodieFilter>
): Prisma.GoodieWhereInput | null => {
  if (filter?.name) {
    return {
      name: {
        contains: filter.name,
        mode: 'insensitive',
      },
    };
  }

  return null;
};

const createMemberPlansFilter = (
  filter?: Partial<GoodieFilter>
): Prisma.GoodieWhereInput | null => {
  if (filter?.memberPlans?.length) {
    return {
      memberPlans: {
        some: {
          id: {
            in: filter.memberPlans,
          },
        },
      },
    };
  }

  return null;
};

const createActiveFilter = (
  filter?: Partial<GoodieFilter>
): Prisma.GoodieWhereInput | null => {
  if (filter?.active != null) {
    return {
      active: filter.active,
    };
  }

  return null;
};

const createGoodieFilter = (
  filter?: Partial<GoodieFilter>
): Prisma.GoodieWhereInput => ({
  AND: [
    createNameFilter(filter),
    createMemberPlansFilter(filter),
    createActiveFilter(filter),
  ].filter((filter): filter is Prisma.GoodieWhereInput => Boolean(filter)),
});
