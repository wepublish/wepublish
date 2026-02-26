import { Injectable } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { UserRoleDataloader } from './user-role.dataloader';
import {
  CreateUserRoleInput,
  UserRoleFilter,
  UserRoleListArgs,
  UserRoleSort,
  UpdateUserRoleInput,
} from './user-role.model';

@Injectable()
export class UserRoleService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(UserRoleDataloader)
  async getUserRoles({
    filter,
    cursorId,
    sort = UserRoleSort.CreatedAt,
    order = SortOrder.Ascending,
    take = 10,
    skip,
  }: UserRoleListArgs) {
    const orderBy = createUserRoleOrder(sort, order);
    const where = createUserRoleFilter(filter);

    const [totalCount, userRoles] = await Promise.all([
      this.prisma.userRole.count({
        where,
        orderBy,
      }),
      this.prisma.userRole.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = userRoles.slice(0, getMaxTake(take));
    const firstUserRole = nodes[0];
    const lastUserRole = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = userRoles.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstUserRole?.id,
        endCursor: lastUserRole?.id,
      },
    };
  }

  @PrimeDataLoader(UserRoleDataloader)
  async updateUserRole({ id, ...input }: UpdateUserRoleInput) {
    return this.prisma.userRole.update({
      where: {
        id,
      },
      data: {
        ...input,
      },
    });
  }

  @PrimeDataLoader(UserRoleDataloader)
  async createUserRole({ ...input }: CreateUserRoleInput) {
    return this.prisma.userRole.create({
      data: {
        ...input,
        systemRole: false,
      },
    });
  }

  async deleteUserRole(id: string) {
    return this.prisma.userRole.delete({
      where: {
        id,
      },
    });
  }
}

export const createUserRoleOrder = (
  field: UserRoleSort,
  sortOrder: SortOrder
): Prisma.UserRoleFindManyArgs['orderBy'] => {
  switch (field) {
    case UserRoleSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case UserRoleSort.CreatedAt:
    default:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createNameFilter = (
  filter?: Partial<UserRoleFilter>
): Prisma.UserRoleWhereInput => {
  if (filter?.name) {
    return {
      OR: [
        {
          name: {
            contains: filter.name,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  return {};
};

const createUserRoleFilter = (
  filter?: Partial<UserRoleFilter>
): Prisma.UserRoleWhereInput => ({
  AND: [createNameFilter(filter)],
});
