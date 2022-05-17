import {Prisma, PrismaClient, User} from '@prisma/client'
import {ConnectionResult} from '../../db/common'
import {UserFilter, UserSort} from '../../db/user'
import {getSortOrder, SortOrder} from '../queries/sort'
import bcrypt from 'bcrypt'

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
): Promise<ConnectionResult<User>> => {
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
      take: take + 1,
      orderBy: orderBy,
      cursor: cursorId ? {id: cursorId} : undefined
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
  const user = await userClient.findUnique({
    where: {
      email
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
