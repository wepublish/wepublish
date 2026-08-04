import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, PrismaClient, Voucher } from '@prisma/client';
import { getMaxTake, PrimeDataLoader, SortOrder } from '@wepublish/utils/api';
import { VoucherDataloader } from './voucher.dataloader';
import {
  CreateVoucherInput,
  VoucherListArgs,
  VoucherSort,
  UpdateVoucherInput,
  VoucherFilter,
} from './voucher.model';

const validateVoucher = ({
  validFrom,
  validTo,
}:
  | Pick<Voucher, 'validFrom' | 'validTo'>
  | Pick<CreateVoucherInput, 'validFrom' | 'validTo'>) => {
  if (new Date(validFrom) > new Date(validTo)) {
    throw new BadRequestException('validTo can not be earlier than validFrom');
  }
};

@Injectable()
export class VoucherService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(VoucherDataloader)
  async getVouchers({
    filter,
    sort = VoucherSort.CreatedAt,
    order = SortOrder.Descending,
    cursorId,
    skip = 0,
    take = 10,
  }: VoucherListArgs) {
    const where = createVoucherFilter(filter);
    const orderBy = createVoucherOrder(sort, order);

    const [totalCount, vouchers] = await Promise.all([
      this.prisma.voucher.count({
        where,
        orderBy,
      }),
      this.prisma.voucher.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = vouchers.slice(0, getMaxTake(take));
    const firstVoucher = nodes[0];
    const lastVoucher = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = vouchers.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstVoucher?.id,
        endCursor: lastVoucher?.id,
      },
    };
  }

  @PrimeDataLoader(VoucherDataloader)
  async updateVoucher({ id, ...input }: UpdateVoucherInput) {
    const voucher = await this.prisma.voucher.findUniqueOrThrow({
      where: {
        id,
      },
    });

    validateVoucher({
      ...voucher,
      ...input,
    });

    if (input.code) {
      input.code = input.code.toLowerCase();
    }

    return this.prisma.voucher.update({
      where: {
        id,
      },
      data: input,
    });
  }

  @PrimeDataLoader(VoucherDataloader)
  async createVoucher(input: CreateVoucherInput) {
    input.code = input.code.toLowerCase();

    validateVoucher(input);

    return this.prisma.voucher.create({
      data: input,
    });
  }

  async deleteVoucher(id: string) {
    return this.prisma.voucher.delete({
      where: {
        id,
      },
    });
  }
}

function createVoucherOrder(
  field: VoucherSort,
  sortOrder: SortOrder
): Prisma.VoucherOrderByWithRelationInput {
  switch (field) {
    case VoucherSort.Discount:
      return {
        discountPercent: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case VoucherSort.ModifiedAt:
      return {
        modifiedAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };

    case VoucherSort.CreatedAt:
    default:
      return {
        createdAt: sortOrder === SortOrder.Ascending ? 'asc' : 'desc',
      };
  }
}

const createMemberPlansFilter = (
  filter?: Partial<VoucherFilter>
): Prisma.VoucherWhereInput | null => {
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
  filter?: Partial<VoucherFilter>
): Prisma.VoucherWhereInput | null => {
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
  filter?: Partial<VoucherFilter>
): Prisma.VoucherWhereInput | null => {
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

const createVoucherFilter = (
  filter?: Partial<VoucherFilter>
): Prisma.VoucherWhereInput => ({
  AND: [
    createMemberPlansFilter(filter),
    createFromFilter(filter),
    createToFilter(filter),
  ].filter((filter): filter is Prisma.VoucherWhereInput => Boolean(filter)),
});
