import {Prisma, PrismaClient, TagType} from '@prisma/client'
import {Context} from '../../context'
import {MaxResultsPerPage} from '../../db/common'
import {authorise, CanGetTags} from '../permissions'
import {getSortOrder, SortOrder} from '../queries/sort'

export type TagFilter = {
  type: TagType
}

export enum TagSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt'
}

export const createTagOrder = (
  field: TagSort,
  sortOrder: SortOrder
): Prisma.TagFindManyArgs['orderBy'] => {
  switch (field) {
    case TagSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }

    case TagSort.CreatedAt:
    default:
      return {
        createdAt: sortOrder
      }
  }
}

const createTypeFilter = (filter?: Partial<TagFilter>): Prisma.TagWhereInput => {
  if (filter?.type) {
    return {
      type: filter?.type
    }
  }

  return {}
}

export const createTagFilter = (filter?: Partial<TagFilter>): Prisma.TagWhereInput => ({
  AND: [createTypeFilter(filter)]
})

export const getTags = async (
  filter: Partial<TagFilter>,
  sortedField: TagSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  tag: PrismaClient['tag']
) => {
  const {roles} = authenticate()
  authorise(CanGetTags, roles)

  const orderBy = createTagOrder(sortedField, getSortOrder(order))
  const where = createTagFilter(filter)

  const [totalCount, tags] = await Promise.all([
    tag.count({
      where,
      orderBy
    }),
    tag.findMany({
      where,
      skip,
      take: Math.min(take, MaxResultsPerPage) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined
    })
  ])

  const nodes = tags.slice(0, take)
  const firstTag = nodes[0]
  const lastTag = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = tags.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstTag?.id,
      endCursor: lastTag?.id
    }
  }
}
