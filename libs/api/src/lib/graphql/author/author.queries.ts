import {Author, Prisma, PrismaClient} from '@prisma/client'
import {SortOrder, getMaxTake, graphQLSortOrderToPrisma} from '@wepublish/utils/api'
import {AuthorFilter, AuthorSort} from '../../db/author'
import {ConnectionResult} from '../../db/common'

export const createAuthorOrder = (
  field: AuthorSort,
  sortOrder: SortOrder
): Prisma.AuthorFindManyArgs['orderBy'] => {
  switch (field) {
    case AuthorSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case AuthorSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case AuthorSort.Name:
      return {
        name: graphQLSortOrderToPrisma(sortOrder)
      }
  }
}

const createNameFilter = (filter: Partial<AuthorFilter>): Prisma.AuthorWhereInput => {
  if (filter?.name) {
    return {
      name: {
        contains: filter.name,
        mode: 'insensitive'
      }
    }
  }

  return {}
}

const createTagIdsFilter = (filter?: Partial<AuthorFilter>): Prisma.AuthorWhereInput => {
  if (filter?.tagIds?.length) {
    return {
      tags: {
        some: {
          tagId: {
            in: filter?.tagIds
          }
        }
      }
    }
  }

  return {}
}

const createHideOnTeamFilter = (filter?: Partial<AuthorFilter>): Prisma.AuthorWhereInput => {
  if (filter != null) {
    return {}
  }
  return {}
}

export const createAuthorFilter = (filter: Partial<AuthorFilter>): Prisma.AuthorWhereInput => ({
  AND: [createNameFilter(filter), createTagIdsFilter(filter), createHideOnTeamFilter(filter)]
})

export const getAuthors = async (
  filter: Partial<AuthorFilter>,
  sortedField: AuthorSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  author: PrismaClient['author']
): Promise<ConnectionResult<Author>> => {
  const orderBy = createAuthorOrder(sortedField, order)
  const where = createAuthorFilter(filter)

  const [totalCount, authors] = await Promise.all([
    author.count({
      where,
      orderBy
    }),
    author.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined,
      include: {
        links: true
      }
    })
  ])

  const nodes = authors.slice(0, take)
  const firstAuthor = nodes[0]
  const lastAuthor = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = authors.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstAuthor?.id,
      endCursor: lastAuthor?.id
    }
  }
}
