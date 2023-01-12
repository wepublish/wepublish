import {Author, Prisma, PrismaClient} from '@prisma/client'
import {AuthorFilter, AuthorSort} from '../../db/author'
import {ConnectionResult, MaxResultsPerPage} from '../../db/common'
import {getSortOrder, SortOrder} from '../queries/sort'

export const createAuthorOrder = (
  field: AuthorSort,
  sortOrder: SortOrder
): Prisma.AuthorFindManyArgs['orderBy'] => {
  switch (field) {
    case AuthorSort.CreatedAt:
      return {
        createdAt: sortOrder
      }

    case AuthorSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }

    case AuthorSort.Name:
      return {
        name: sortOrder
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

export const createAuthorFilter = (filter: Partial<AuthorFilter>): Prisma.AuthorWhereInput => ({
  AND: [createNameFilter(filter)]
})

export const getAuthors = async (
  filter: Partial<AuthorFilter>,
  sortedField: AuthorSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  author: PrismaClient['author']
): Promise<ConnectionResult<Author>> => {
  const orderBy = createAuthorOrder(sortedField, getSortOrder(order))
  const where = createAuthorFilter(filter)

  const [totalCount, authors] = await Promise.all([
    author.count({
      where,
      orderBy
    }),
    author.findMany({
      where,
      skip,
      take: Math.min(take, MaxResultsPerPage) + 1,
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
