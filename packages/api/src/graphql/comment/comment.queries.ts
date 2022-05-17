import {Comment, Prisma, PrismaClient} from '@prisma/client'
import {CommentFilter, CommentSort} from '../../db/comment'
import {ConnectionResult} from '../../db/common'
import {getSortOrder, SortOrder} from '../queries/sort'

export const createCommentOrder = (
  field: CommentSort,
  sortOrder: SortOrder
): Prisma.CommentFindManyArgs['orderBy'] => {
  switch (field) {
    case CommentSort.CreatedAt:
      return {
        createdAt: sortOrder
      }

    case CommentSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }
  }
}

const createStateFilter = (filter: Partial<CommentFilter>): Prisma.CommentWhereInput => {
  if (filter?.states) {
    return {
      state: {
        in: filter.states
      }
    }
  }

  return {}
}

export const createCommentFilter = (filter: Partial<CommentFilter>): Prisma.CommentWhereInput => ({
  AND: [createStateFilter(filter)]
})

export const getComments = async (
  filter: Partial<CommentFilter>,
  sortedField: CommentSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  comment: PrismaClient['comment']
): Promise<ConnectionResult<Comment>> => {
  const orderBy = createCommentOrder(sortedField, getSortOrder(order))
  const where = createCommentFilter(filter)

  const [totalCount, comments] = await Promise.all([
    comment.count({
      where: where,
      orderBy: orderBy
    }),
    comment.findMany({
      where: where,
      skip: skip,
      take: take + 1,
      orderBy: orderBy,
      cursor: cursorId ? {id: cursorId} : undefined
    })
  ])

  const nodes = comments.slice(0, take)
  const firstComment = nodes[0]
  const lastComment = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = comments.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstComment?.id,
      endCursor: lastComment?.id
    }
  }
}
