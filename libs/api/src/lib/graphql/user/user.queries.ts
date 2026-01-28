import { Prisma, PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { ConnectionResult } from '../../db/common';
import { UserFilter, UserSort, UserWithRelations } from '../../db/user';
import { unselectPassword } from '@wepublish/authentication/api';
import { Validator } from '../../validator';
import {
  SortOrder,
  getMaxTake,
  graphQLSortOrderToPrisma,
} from '@wepublish/utils/api';

export const createUserOrder = (
  field: UserSort,
  sortOrder: SortOrder
): Prisma.UserFindManyArgs['orderBy'] => {
  switch (field) {
    case UserSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case UserSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case UserSort.Name:
      return {
        name: graphQLSortOrderToPrisma(sortOrder),
      };

    case UserSort.FirstName:
      return {
        firstName: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createUserRoleFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  if (filter?.userRole) {
    return {
      roleIDs: {
        hasSome: filter.userRole,
      },
    };
  }

  return {};
};

const createNameFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  if (filter?.name) {
    return {
      name: {
        contains: filter.name,
        mode: 'insensitive',
      },
    };
  }

  return {};
};
const createUserNameFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  const splitedString = (filter.text || '').split(' ');

  if (splitedString.length === 1) {
    return {
      OR: [
        {
          firstName: {
            contains: splitedString[0],
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: splitedString[0],
            mode: 'insensitive',
          },
        },
      ],
    };
  } else if (splitedString.length === 2) {
    return {
      // Double word first / last names
      OR: [
        {
          firstName: {
            contains: `${splitedString[0]} ${splitedString[1]}`,
            mode: 'insensitive',
          },
        },
        {
          name: {
            contains: `${splitedString[0]} ${splitedString[1]}`,
            mode: 'insensitive',
          },
        },
        // Single word first and lastname
        {
          AND: [
            {
              firstName: {
                contains: splitedString[0],
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString[1],
                mode: 'insensitive',
              },
            },
          ],
        },
        {
          AND: [
            {
              firstName: {
                contains: splitedString[1],
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString[0],
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };
  } else {
    return {
      OR: [
        {
          // Filter start with double firstname and ends with single or multi-word lastname
          AND: [
            {
              firstName: {
                contains: `${splitedString[0]} ${splitedString[1]}`,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString.slice(2).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
        {
          // Filter start with single firstname and ends with multi-word lastname
          AND: [
            {
              firstName: {
                contains: `${splitedString[0]}`,
                mode: 'insensitive',
              },
            },
            {
              name: {
                contains: splitedString.slice(1).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
        // Filter start with double lastname and ends with single or multi-word firstname
        {
          AND: [
            {
              name: {
                contains: `${splitedString[0]} ${splitedString[1]}`,
                mode: 'insensitive',
              },
            },
            {
              firstName: {
                contains: splitedString.slice(2).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
        // Filter start with single lastname and ends with multi-word firstname
        {
          AND: [
            {
              name: {
                contains: `${splitedString[0]}`,
                mode: 'insensitive',
              },
            },
            {
              firstName: {
                contains: splitedString.slice(2).join(' '),
                mode: 'insensitive',
              },
            },
          ],
        },
      ],
    };
  }
};

const createTextFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  if (filter?.text) {
    return {
      OR: [
        {
          email: {
            contains: filter.text,
            mode: 'insensitive',
          },
        },
        {
          address: {
            OR: [
              {
                streetAddress: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
              {
                streetAddressNumber: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
              {
                zipCode: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
              {
                city: {
                  contains: filter.text,
                  mode: 'insensitive',
                },
              },
            ],
          },
        },
        createUserNameFilter(filter),
      ],
    };
  }

  return {};
};

export const createUserFilter = (
  filter: Partial<UserFilter>
): Prisma.UserWhereInput => {
  return {
    AND: [
      createNameFilter(filter),
      createTextFilter(filter),
      createUserRoleFilter(filter),
    ],
  };
};

export const getUsers = async (
  filter: Partial<UserFilter>,
  sortedField: UserSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  user: PrismaClient['user']
): Promise<ConnectionResult<UserWithRelations>> => {
  const orderBy = createUserOrder(sortedField, order);
  const where = createUserFilter(filter);

  const [totalCount, users] = await Promise.all([
    user.count({
      where,
      orderBy,
    }),
    user.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? { id: cursorId } : undefined,
      select: unselectPassword,
    }),
  ]);

  const nodes = users.slice(0, take);
  const firstUser = nodes[0];
  const lastUser = nodes[nodes.length - 1];

  const hasPreviousPage = Boolean(skip);
  const hasNextPage = users.length > nodes.length;

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstUser?.id,
      endCursor: lastUser?.id,
    },
  };
};

export const getUserForCredentials = async (
  email: string,
  password: string,
  userClient: PrismaClient['user']
) => {
  email = email.toLowerCase();
  await Validator.login.parse({ email });

  const user = await userClient.findUnique({
    where: {
      email,
    },
    include: {
      address: true,
      paymentProviderCustomers: true,
      properties: true,
    },
  });

  if (!user) {
    return null;
  }

  const theSame = await bcrypt.compare(password, user.password);

  if (!theSame) {
    return null;
  }

  return user;
};
