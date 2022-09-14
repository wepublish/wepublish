import {Prisma, PrismaClient} from '@prisma/client'
import bcrypt from 'bcrypt'
import {ConnectionResult, MaxResultsPerPage} from '../../db/common'
import {unselectPassword, UserFilter, UserSort, UserWithRelations} from '../../db/user'
import {Validator} from '../../validator'
import {getSortOrder, SortOrder} from '../queries/sort'

export const createUserOrder = (
  field: UserSort,
  sortOrder: SortOrder
): Prisma.UserFindManyArgs['orderBy'] => {
  switch (field) {
    case UserSort.CreatedAt:
      return {
        createdAt: sortOrder
      }

    case UserSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }

    case UserSort.Name:
      return {
        name: sortOrder
      }

    case UserSort.FirstName:
      return {
        firstName: sortOrder
      }
  }
}

const createNameFilter = (filter: Partial<UserFilter>): Prisma.UserWhereInput => {
  if (filter?.name) {
    return {
      name: {
        contains: filter.text,
        mode: 'insensitive'
      }
    }
  }

  return {}
}

const createTextFilter = (filter: Partial<UserFilter>): Prisma.UserWhereInput => {
  if (filter?.text) {
    return {
      OR: [
        {
          preferredName: {
            contains: filter.text,
            mode: 'insensitive'
          }
        },
        {
          firstName: {
            contains: filter.text,
            mode: 'insensitive'
          }
        },
        {
          name: {
            contains: filter.text,
            mode: 'insensitive'
          }
        },
        {
          email: {
            contains: filter.text,
            mode: 'insensitive'
          }
        },
        {
          address: {
            OR: [
              {
                streetAddress: {
                  contains: filter.text,
                  mode: 'insensitive'
                }
              },
              {
                zipCode: {
                  contains: filter.text,
                  mode: 'insensitive'
                }
              },
              {
                city: {
                  contains: filter.text,
                  mode: 'insensitive'
                }
              }
            ]
          }
        }
      ]
    }
  }

  return {}
}

export const createUserFilter = (filter: Partial<UserFilter>): Prisma.UserWhereInput => ({
  AND: [createNameFilter(filter), createTextFilter(filter)]
})

export const getUsers = async (
  filter: Partial<UserFilter>,
  sortedField: UserSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  user: PrismaClient['user']
): Promise<ConnectionResult<UserWithRelations>> => {
  const orderBy = createUserOrder(sortedField, getSortOrder(order))
  const where = createUserFilter(filter)

  const [totalCount, users] = await Promise.all([
    user.count({
      where: where,
      orderBy: orderBy
    }),
    user.findMany({
      where: where,
      skip: skip,
      take: Math.min(take, MaxResultsPerPage) + 1,
      orderBy: orderBy,
      cursor: cursorId ? {id: cursorId} : undefined,
      select: unselectPassword
    })
  ])

  const nodes = users.slice(0, take)
  const firstUser = nodes[0]
  const lastUser = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = users.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstUser?.id,
      endCursor: lastUser?.id
    }
  }
}

export const getUserForCredentials = async (
  email: string,
  password: string,
  userClient: PrismaClient['user']
) => {
  email = email.toLowerCase()
  await Validator.login().validateAsync({email})

  const user = await userClient.findUnique({
    where: {
      email
    },
    include: {
      address: true,
      oauth2Accounts: true,
      paymentProviderCustomers: true,
      properties: true
    }
  })

  if (!user) {
    return null
  }

  const theSame = await bcrypt.compare(password, user.password)

  if (!theSame) {
    return null
  }

  return user
}
