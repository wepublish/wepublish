import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import {
  CreateMemberPlanInput,
  MemberPlanFilter,
  MemberPlanListArgs,
  MemberPlanSort,
  UpdateMemberPlanInput,
} from './member-plan.model';
import { MemberPlanDataloader } from './member-plan.dataloader';

@Injectable()
export class MemberPlanService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlanBySlug(slug: string) {
    return this.prisma.memberPlan.findFirst({
      where: {
        slug,
      },
      include: {
        availablePaymentMethods: true,
      },
    });
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlans({
    filter,
    sort = MemberPlanSort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: MemberPlanListArgs) {
    const orderBy = createMemberPlanOrder(sort, order);
    const where = createMemberPlanFilter(filter);

    const [totalCount, memberplans] = await Promise.all([
      this.prisma.memberPlan.count({
        where,
        orderBy,
      }),
      this.prisma.memberPlan.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
        include: {
          availablePaymentMethods: true,
        },
      }),
    ]);

    const nodes = memberplans.slice(0, getMaxTake(take));
    const firstMemberPlan = nodes[0];
    const lastMemberPlan = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = memberplans.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstMemberPlan?.id,
        endCursor: lastMemberPlan?.id,
      },
    };
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async getActiveMemberPlans() {
    return this.prisma.memberPlan.findMany({
      where: {
        active: true,
      },
      include: {
        availablePaymentMethods: true,
      },
    });
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async updateMemberPlan({
    id,
    availablePaymentMethods,
    ...input
  }: UpdateMemberPlanInput) {
    const existingMemberPlan = await this.prisma.memberPlan.findUniqueOrThrow({
      where: { id },
      include: {
        availablePaymentMethods: true,
      },
    });

    checkMemberPlanIntegrity({
      extendable:
        (input.extendable as boolean | undefined) ??
        existingMemberPlan.extendable,

      periodAmountConfig:
        input.periodAmountConfig ?? existingMemberPlan.periodAmountConfig,

      availablePaymentMethods:
        availablePaymentMethods ?? existingMemberPlan.availablePaymentMethods,
    });

    return this.prisma.memberPlan.update({
      where: { id },
      data: {
        ...input,
        description: input.description as any[],
        shortDescription: input.shortDescription as any[],
        availablePaymentMethods:
          availablePaymentMethods ?
            {
              deleteMany: {
                memberPlanId: {
                  equals: id,
                },
              },
              createMany: {
                data: availablePaymentMethods,
              },
            }
          : undefined,
      },
      include: {
        availablePaymentMethods: true,
      },
    });
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async createMemberPlan({
    availablePaymentMethods,
    ...input
  }: CreateMemberPlanInput) {
    checkMemberPlanIntegrity({
      extendable: input.extendable ?? true,
      periodAmountConfig: input.periodAmountConfig,
      availablePaymentMethods,
    });

    return this.prisma.memberPlan.create({
      data: {
        ...input,
        description: input.description as any[],
        shortDescription: input.shortDescription as any[],
        availablePaymentMethods: {
          createMany: {
            data: availablePaymentMethods,
          },
        },
      },
      include: {
        availablePaymentMethods: true,
      },
    });
  }

  async deleteMemberPlan(id: string) {
    return this.prisma.memberPlan.delete({
      where: {
        id,
      },
    });
  }
}

export const createMemberPlanOrder = (
  field: MemberPlanSort,
  sortOrder: SortOrder
): Prisma.MemberPlanFindManyArgs['orderBy'] => {
  switch (field) {
    case MemberPlanSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case MemberPlanSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createNameFilter = (
  filter: Partial<MemberPlanFilter>
): Prisma.MemberPlanWhereInput => {
  if (filter?.name) {
    return {
      name: filter.name,
    };
  }

  return {};
};

const createActiveFilter = (
  filter: Partial<MemberPlanFilter>
): Prisma.MemberPlanWhereInput => {
  if (filter?.active != null) {
    return {
      active: filter.active,
    };
  }

  return {};
};

const createTagsFilter = (
  filter: Partial<MemberPlanFilter>
): Prisma.MemberPlanWhereInput => {
  if (filter?.tags?.length) {
    return {
      tags: {
        hasSome: filter.tags,
      },
    };
  }

  return {};
};

const createProductTypeFilter = (
  filter: Partial<MemberPlanFilter>
): Prisma.MemberPlanWhereInput => {
  if (filter?.productType) {
    return {
      productType: filter.productType,
    };
  }

  return {};
};

export const createMemberPlanFilter = (
  filter?: Partial<MemberPlanFilter>
): Prisma.MemberPlanWhereInput => {
  if (filter) {
    return {
      AND: [
        createNameFilter(filter),
        createActiveFilter(filter),
        createTagsFilter(filter),
        createProductTypeFilter(filter),
      ],
    };
  }
  return {};
};

type MemberPlanIntegrityInput = {
  extendable: boolean;
  periodAmountConfig: PrismaJson.PeriodAmountConfig;
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};

function checkMemberPlanIntegrity(input: MemberPlanIntegrityInput): void {
  const { extendable, periodAmountConfig, availablePaymentMethods } = input;

  const hasForceAutoRenew = !!availablePaymentMethods.find(
    apm => apm.forceAutoRenewal
  );

  if (!extendable && hasForceAutoRenew) {
    throw new BadRequestException(
      `Memberplan cannot be non-renewable and auto-renew at the same time.`
    );
  }

  for (const config of periodAmountConfig) {
    if (config.max != null && config.min > config.max) {
      throw new BadRequestException(
        `Memberplan config.max can not be lower than config.min`
      );
    }

    if (config.target != null && config.target <= config.min) {
      throw new BadRequestException(
        `Memberplan config.target can not be lower than config.min`
      );
    }

    if (
      config.target != null &&
      config.max != null &&
      config.target > config.max
    ) {
      throw new BadRequestException(
        `Memberplan config.target can not be higher than config.max`
      );
    }
  }
}
