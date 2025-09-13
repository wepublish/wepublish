import {Prisma, PrismaClient, TagType} from '@prisma/client'
import {CanGetTags} from '@wepublish/permissions'
import {getMaxTake, graphQLSortOrderToPrisma, SortOrder} from '@wepublish/utils/api'
import {Context} from '../../context'
import {authorise} from '../permissions'

export type TagFilter = {
  type: TagType
  tag: string
}

export enum TagSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  Tag = 'Tag'
}

export const createTagOrder = (
  field: TagSort,
  sortOrder: SortOrder
): Prisma.TagFindManyArgs['orderBy'] => {
  switch (field) {
    case TagSort.Tag:
      return {
        tag: graphQLSortOrderToPrisma(sortOrder)
      }

    case TagSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder)
      }

    case TagSort.CreatedAt:
    default:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder)
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

const createTagNameFilter = (filter?: Partial<TagFilter>): Prisma.TagWhereInput => {
  if (filter?.tag) {
    return {
      tag: {
        mode: 'insensitive',
        contains: filter.tag
      }
    }
  }

  return {}
}

export const createTagFilter = (filter?: Partial<TagFilter>): Prisma.TagWhereInput => ({
  AND: [createTypeFilter(filter), createTagNameFilter(filter)]
})

// Relation mapping for efficient count queries
const relationForType: Record<TagType, keyof Prisma.TagCountOutputType> = {
  [TagType.Comment]: 'comments',
  [TagType.Event]: 'events',
  [TagType.Author]: 'authors',
  [TagType.Article]: 'articles',
  [TagType.Page]: 'pages'
}

export const getTags = async (
  filter: Partial<TagFilter>,
  sortedField: TagSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  tag: PrismaClient['tag']
) => {
  const {roles} = authenticate()
  authorise(CanGetTags, roles)

  const orderBy = createTagOrder(sortedField, order)
  const where = createTagFilter(filter)

  const [totalCount, tags] = await Promise.all([
    tag.count({
      where,
      orderBy
    }),
    tag.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
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

export const getTagsWithCount = async (
  filter: Partial<TagFilter>,
  sortedField: TagSort,
  order: SortOrder,
  cursorId: string | null,
  skip: number,
  take: number,
  authenticate: Context['authenticate'],
  tag: PrismaClient['tag']
) => {
  const {roles} = authenticate()
  authorise(CanGetTags, roles)

  const orderBy = createTagOrder(sortedField, order)
  const where = createTagFilter(filter)

  // Get the relation key for the count based on tag type
  const relationKey = filter.type ? relationForType[filter.type] : undefined

  const [totalCount, tags] = await Promise.all([
    tag.count({
      where,
      orderBy
    }),
    tag.findMany({
      where,
      skip,
      take: getMaxTake(take) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined,
      include: {
        _count: relationKey
          ? {
              select: {[relationKey]: true}
            }
          : {
              select: {
                comments: true,
                events: true,
                authors: true,
                articles: true,
                pages: true
              }
            }
      }
    })
  ])

  const nodes = tags.slice(0, take).map(tag => {
    // Get the count for the specific relation type, or sum all if no specific type
    const count = relationKey
      ? (tag._count as any)[relationKey]
      : Object.values(tag._count).reduce((sum: number, val: number) => sum + val, 0)

    return {
      ...tag,
      count
    }
  })

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
