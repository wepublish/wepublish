import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentPeriodicity, Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  periodicityPricingSchema,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import {
  CreateMemberPlanInput,
  MemberPlanFilter,
  MemberPlanListArgs,
  MemberPlanSort,
  PeriodicityPriceInput,
  UpdateMemberPlanInput,
} from './member-plan.model';
import { MemberPlanDataloader } from './member-plan.dataloader';
import {
  KvTtlCacheService,
  PublicContentCacheInvalidator,
} from '@wepublish/kv-ttl-cache/api';

const CACHE_NAMESPACE = 'member-plans';
const CACHE_TTL_SECONDS = 300;

@Injectable()
export class MemberPlanService {
  constructor(
    private prisma: PrismaClient,
    private kv: KvTtlCacheService,
    private publicContentCache: PublicContentCacheInvalidator
  ) {}

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlanBySlug(slug: string) {
    return this.kv.getOrLoadNs(
      CACHE_NAMESPACE,
      `slug:${slug}`,
      () =>
        this.prisma.memberPlan.findFirst({
          where: {
            slug,
          },
          include: {
            availablePaymentMethods: true,
            periodicityPricing: true,
          },
        }),
      CACHE_TTL_SECONDS
    );
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async getMemberPlans(args: MemberPlanListArgs) {
    return this.kv.getOrLoadNs(
      CACHE_NAMESPACE,
      `list:${JSON.stringify(args)}`,
      () => this.loadMemberPlans(args),
      CACHE_TTL_SECONDS
    );
  }

  private async loadMemberPlans({
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
          periodicityPricing: true,
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
    return this.kv.getOrLoadNs(
      CACHE_NAMESPACE,
      'active',
      () =>
        this.prisma.memberPlan.findMany({
          where: {
            active: true,
          },
          include: {
            availablePaymentMethods: true,
            periodicityPricing: true,
          },
        }),
      CACHE_TTL_SECONDS
    );
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async updateMemberPlan({
    id,
    availablePaymentMethods,
    periodicityPricing,
    ...input
  }: UpdateMemberPlanInput) {
    if (periodicityPricing === null || periodicityPricing?.length === 0) {
      throw new BadRequestException(
        'A member plan requires at least one periodicity price; periodicityPricing cannot be cleared'
      );
    }

    checkPeriodicityPricing(periodicityPricing);

    const existingMemberPlan = await this.prisma.memberPlan.findUniqueOrThrow({
      where: { id },
      select: {
        extendable: true,
        defaultPaymentPeriodicity: true,
        availablePaymentMethods: true,
      },
    });

    checkMemberPlanIntegrity({
      extendable:
        (input.extendable as boolean | undefined) ??
        existingMemberPlan.extendable,

      defaultPaymentPeriodicity:
        input.defaultPaymentPeriodicity === null ?
          null
        : ((input.defaultPaymentPeriodicity as
            | PaymentPeriodicity
            | undefined) ?? existingMemberPlan.defaultPaymentPeriodicity),

      availablePaymentMethods:
        availablePaymentMethods ?? existingMemberPlan.availablePaymentMethods,
    });

    const memberPlan = await this.prisma.memberPlan.update({
      where: { id },
      data: {
        ...input,
        description: input.description as any,
        shortDescription: input.shortDescription as any,
        periodicityPricing:
          periodicityPricing ?
            {
              deleteMany: {
                memberPlanId: {
                  equals: id,
                },
              },
              createMany: {
                data: periodicityPricing.map(toPeriodicityPriceCreate),
              },
            }
          : undefined,
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
        periodicityPricing: true,
      },
    });
    await this.forgetMemberPlans();

    return memberPlan;
  }

  @PrimeDataLoader(MemberPlanDataloader)
  async createMemberPlan({
    availablePaymentMethods,
    periodicityPricing,
    ...input
  }: CreateMemberPlanInput) {
    const pricing =
      periodicityPricing?.length ? periodicityPricing : (
        [
          defaultPeriodicityPrice(
            input.defaultPaymentPeriodicity ?? null,
            availablePaymentMethods
          ),
        ]
      );

    checkPeriodicityPricing(pricing);
    checkMemberPlanIntegrity({
      extendable: input.extendable ?? true,
      defaultPaymentPeriodicity: input.defaultPaymentPeriodicity ?? null,
      availablePaymentMethods,
    });

    const data: Prisma.MemberPlanUncheckedCreateInput = {
      ...input,
      description: input.description as any,
      shortDescription: input.shortDescription as any,
      periodicityPricing: {
        createMany: {
          data: pricing.map(toPeriodicityPriceCreate),
        },
      },
      availablePaymentMethods: {
        createMany: {
          data: availablePaymentMethods,
        },
      },
    };

    const memberPlan = await this.prisma.memberPlan.create({
      data,
      include: {
        availablePaymentMethods: true,
        periodicityPricing: true,
      },
    });
    await this.forgetMemberPlans();

    return memberPlan;
  }

  async deleteMemberPlan(id: string) {
    const memberPlan = await this.prisma.memberPlan.delete({
      where: {
        id,
      },
    });
    await this.forgetMemberPlans();

    return memberPlan;
  }

  private async forgetMemberPlans() {
    await this.kv.resetNamespace(CACHE_NAMESPACE);
    await this.publicContentCache.invalidate('paywalls');
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
  defaultPaymentPeriodicity: PaymentPeriodicity | null;
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[];
};

function defaultPeriodicityPrice(
  defaultPaymentPeriodicity: PaymentPeriodicity | null,
  availablePaymentMethods: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput[]
): PeriodicityPriceInput {
  const periodicity =
    defaultPaymentPeriodicity ??
    availablePaymentMethods.flatMap(apm =>
      toPeriodicityArray(apm.paymentPeriodicities)
    )[0] ??
    PaymentPeriodicity.monthly;

  return { periodicity, amountMin: 0 };
}

function toPeriodicityArray(
  paymentPeriodicities: Prisma.AvailablePaymentMethodUncheckedCreateWithoutMemberPlanInput['paymentPeriodicities']
): PaymentPeriodicity[] {
  if (Array.isArray(paymentPeriodicities)) {
    return paymentPeriodicities;
  }

  if (paymentPeriodicities?.set) {
    return paymentPeriodicities.set;
  }

  return [];
}

function toPeriodicityPriceCreate({
  periodicity,
  label,
  amountMin,
  amountTarget,
  amountMax,
}: PeriodicityPriceInput): Prisma.MemberPlanPeriodicityPriceCreateManyMemberPlanInput {
  return {
    periodicity,
    label: label ?? null,
    amountMin: amountMin ?? null,
    amountTarget: amountTarget ?? null,
    amountMax: amountMax ?? null,
  };
}

function checkPeriodicityPricing(periodicityPricing: unknown): void {
  if (periodicityPricing == null) {
    return;
  }

  const result = periodicityPricingSchema.safeParse(periodicityPricing);

  if (!result.success) {
    throw new BadRequestException(
      `Invalid periodicityPricing: ${result.error.issues
        .map(issue => issue.message)
        .join(', ')}`
    );
  }
}

function checkMemberPlanIntegrity(input: MemberPlanIntegrityInput): void {
  const { extendable, defaultPaymentPeriodicity, availablePaymentMethods } =
    input;
  const hasForceAutoRenew = !!availablePaymentMethods.find(
    apm => apm.forceAutoRenewal
  );

  if (!extendable && hasForceAutoRenew) {
    throw new BadRequestException(
      `Memberplan cannot be non-renewable and auto-renew at the same time.`
    );
  }

  if (
    defaultPaymentPeriodicity != null &&
    !availablePaymentMethods.some(apm =>
      toPeriodicityArray(apm.paymentPeriodicities).includes(
        defaultPaymentPeriodicity
      )
    )
  ) {
    throw new BadRequestException(
      `Memberplan defaultPaymentPeriodicity has to be offered by at least one payment method`
    );
  }
}
