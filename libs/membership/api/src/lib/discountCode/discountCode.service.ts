import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, DiscountCode } from '@prisma/client';
import { getMaxTake, PrimeDataLoader, SortOrder } from '@wepublish/utils/api';
import { DiscountCodeDataloader } from './discountCode.dataloader';
import {
  CreateDiscountCodeInput,
  DiscountCodeListArgs,
  DiscountCodesort,
  UpdateDiscountCodeInput,
  DiscountCodeFilter,
} from './discountCode.model';

const validateDiscountCode = ({
  validFrom,
  validTo,
}:
  | Pick<DiscountCode, 'validFrom' | 'validTo'>
  | Pick<CreateDiscountCodeInput, 'validFrom' | 'validTo'>) => {
  if (new Date(validFrom) > new Date(validTo)) {
    throw new BadRequestException('validTo can not be earlier than validFrom');
  }
};

@Injectable()
export class DiscountCodeService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(DiscountCodeDataloader)
  async getDiscountCodes({
    filter,
    sort = DiscountCodesort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: DiscountCodeListArgs) {
    const where = createDiscountCodeFilter(filter);
    const orderBy = createDiscountCodeOrder(sort, order);

    const [totalCount, discountCodes] = await Promise.all([
      this.prisma.discountCode.count({
        where,
        orderBy,
      }),
      this.prisma.discountCode.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = discountCodes.slice(0, getMaxTake(take));
    const firstDiscountCode = nodes[0];
    const lastDiscountCode = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = discountCodes.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstDiscountCode?.id,
        endCursor: lastDiscountCode?.id,
      },
    };
  }

  @PrimeDataLoader(DiscountCodeDataloader)
  async getValidDiscountCode(discountCode: string, memberPlanId: string) {
    const discountCodeObj = await this.prisma.discountCode.findUnique({
      where: {
        code_memberPlanId: {
          code: discountCode.toLowerCase(),
          memberPlanId,
        },
      },
    });

    if (!discountCodeObj || discountCodeObj.validFrom > new Date()) {
      throw new BadRequestException('DiscountCode is invalid.');
    }

    if (new Date() > discountCodeObj.validTo) {
      throw new BadRequestException('DiscountCode has expired.');
    }

    return discountCodeObj;
  }

  @PrimeDataLoader(DiscountCodeDataloader)
  async updateDiscountCode({ id, ...input }: UpdateDiscountCodeInput) {
    const discountCode = await this.prisma.discountCode.findUniqueOrThrow({
      where: {
        id,
      },
    });

    validateDiscountCode({
      ...discountCode,
      ...input,
    });

    if (input.code) {
      input.code = input.code.toLowerCase();
    }

    return this.prisma.discountCode.update({
      where: {
        id,
      },
      data: input,
    });
  }

  @PrimeDataLoader(DiscountCodeDataloader)
  async createDiscountCode(input: CreateDiscountCodeInput) {
    input.code = input.code.toLowerCase();

    validateDiscountCode(input);

    return this.prisma.discountCode.create({
      data: input,
    });
  }

  async deleteDiscountCode(id: string) {
    return this.prisma.discountCode.delete({
      where: {
        id,
      },
    });
  }
}

function createDiscountCodeOrder(
  field: DiscountCodesort,
  sortOrder: SortOrder
): Prisma.DiscountCodeOrderByWithRelationInput {
  switch (field) {
    case DiscountCodesort.Discount:
      return {
        discountPercent: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case DiscountCodesort.ModifiedAt:
      return {
        modifiedAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case DiscountCodesort.CreatedAt:
    default:
      return {
        createdAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };
  }
}

const createMemberPlansFilter = (
  filter?: Partial<DiscountCodeFilter>
): Prisma.DiscountCodeWhereInput | null => {
  if (filter?.memberPlans?.length) {
    return {
      memberPlanId: {
        in: filter.memberPlans,
      },
    };
  }

  return null;
};

const createFromFilter = (
  filter?: Partial<DiscountCodeFilter>
): Prisma.DiscountCodeWhereInput | null => {
  if (filter?.from) {
    return {
      OR: [
        {
          validFrom: {
            gte: filter.from,
          },
        },
        {
          validTo: {
            gte: filter.from,
          },
        },
      ],
    };
  }

  return null;
};

const createToFilter = (
  filter?: Partial<DiscountCodeFilter>
): Prisma.DiscountCodeWhereInput | null => {
  if (filter?.to) {
    return {
      OR: [
        {
          validFrom: {
            lte: filter.to,
          },
        },
        {
          validTo: {
            lte: filter.to,
          },
        },
      ],
    };
  }

  return null;
};

const createDiscountCodeFilter = (
  filter?: Partial<DiscountCodeFilter>
): Prisma.DiscountCodeWhereInput => ({
  AND: [
    createMemberPlansFilter(filter),
    createFromFilter(filter),
    createToFilter(filter),
  ].filter((filter): filter is Prisma.DiscountCodeWhereInput =>
    Boolean(filter)
  ),
});
