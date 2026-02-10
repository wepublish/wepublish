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

    const nodes = memberplans.slice(0, take);
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
      select: {
        extendable: true,
        amountPerMonthMin: true,
        amountPerMonthMax: true,
        amountPerMonthTarget: true,
        availablePaymentMethods: true,
      },
    });

    checkMemberPlanIntegrity({
      extendable:
        (input.extendable as boolean | undefined) ??
        existingMemberPlan.extendable,

      amountPerMonthMin:
        (input.amountPerMonthMin as number | undefined) ??
        existingMemberPlan.amountPerMonthMin,

      amountPerMonthMax:
        input.amountPerMonthMax === null ?
          null
        : ((input.amountPerMonthMax as number | undefined) ??
          existingMemberPlan.amountPerMonthMax),

      amountPerMonthTarget:
        input.amountPerMonthTarget === null ?
          null
        : ((input.amountPerMonthTarget as number | undefined) ??
          existingMemberPlan.amountPerMonthTarget),

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
      amountPerMonthMin: input.amountPerMonthMin,
      amountPerMonthMax: input.amountPerMonthMax ?? null,
      amountPerMonthTarget: input.amountPerMonthTarget ?? null,
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
  amountPerMonthMin: number;
  amountPerMonthMax: number | null;
  amountPerMonthTarget: number | null;
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};

function checkMemberPlanIntegrity(input: MemberPlanIntegrityInput): void {
  const {
    extendable,
    amountPerMonthMin,
    amountPerMonthMax,
    amountPerMonthTarget,
    availablePaymentMethods,
  } = input;
  const hasForceAutoRenew = !!availablePaymentMethods.find(
    apm => apm.forceAutoRenewal
  );

  if (!extendable && hasForceAutoRenew) {
    throw new BadRequestException(
      `Memberplan cannot be non-renewable and auto-renew at the same time.`
    );
  }

  if (amountPerMonthMax != null && amountPerMonthMin > amountPerMonthMax) {
    throw new BadRequestException(
      `Memberplan amountPerMonthMax can not be lower than amountPerMonthMin`
    );
  }

  if (
    amountPerMonthTarget != null &&
    amountPerMonthTarget <= amountPerMonthMin
  ) {
    throw new BadRequestException(
      `Memberplan amountPerMonthTarget can not be lower than amountPerMonthMin`
    );
  }

  if (
    amountPerMonthTarget != null &&
    amountPerMonthMax != null &&
    amountPerMonthTarget > amountPerMonthMax
  ) {
    throw new BadRequestException(
      `Memberplan amountPerMonthTarget can not be higher than amountPerMonthMax`
    );
  }
}
