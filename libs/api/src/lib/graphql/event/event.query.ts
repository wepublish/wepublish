import {Prisma, PrismaClient} from '@prisma/client'
import {MaxResultsPerPage} from '../../db/common'
import {getSortOrder, SortOrder} from '../queries/sort'

export const getEvent = (id: string, event: PrismaClient['event']) => {
  return event.findUnique({
    where: {id}
  })
}

export type EventFilter = {
  upcomingOnly: boolean
  from: Date
  to: Date
  tags: string[]
}

export enum EventSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  StartsAt = 'StartsAt',
  EndsAt = 'EndsAt'
}

export const createEventOrder = (
  field: EventSort,
  sortOrder: SortOrder
): Prisma.EventFindManyArgs['orderBy'] => {
  switch (field) {
    case EventSort.ModifiedAt:
      return {
        modifiedAt: sortOrder
      }

    case EventSort.CreatedAt:
      return {
        createdAt: sortOrder
      }

    case EventSort.EndsAt:
      return {
        endsAt: sortOrder
      }

    case EventSort.StartsAt:
    default:
      return {
        startsAt: sortOrder
      }
  }
}

const createTagFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => {
  if (filter?.tags?.length) {
    return {
      tags: {
        some: {
          tagId: {
            in: filter?.tags
          }
        }
      }
    }
  }

  return {}
}

const createUpcomingOnlyFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => {
  if (filter?.upcomingOnly) {
    return {
      OR: [
        {
          startsAt: {
            gte: new Date()
          }
        },
        {
          endsAt: {
            gte: new Date()
          }
        }
      ]
    }
  }

  return {}
}

const createFromFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => {
  if (filter?.from) {
    return {
      OR: [
        {
          startsAt: {
            gte: filter.from
          }
        },
        {
          endsAt: {
            gte: filter.from
          }
        }
      ]
    }
  }

  return {}
}

const createToFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => {
  if (filter?.to) {
    return {
      OR: [
        {
          startsAt: {
            lte: filter.to
          }
        },
        {
          endsAt: {
            lte: filter.to
          }
        }
      ]
    }
  }

  return {}
}

export const createEventFilter = (filter?: Partial<EventFilter>): Prisma.EventWhereInput => ({
  AND: [
    createUpcomingOnlyFilter(filter),
    createFromFilter(filter),
    createToFilter(filter),
    createTagFilter(filter)
  ]
})

export const getEvents = async (
  filter: Partial<EventFilter>,
  sortedField: EventSort,
  order: 1 | -1,
  cursorId: string | null,
  skip: number,
  take: number,
  event: PrismaClient['event']
) => {
  const orderBy = createEventOrder(sortedField, getSortOrder(order))
  const where = createEventFilter(filter)

  const [totalCount, events] = await Promise.all([
    event.count({
      where,
      orderBy
    }),
    event.findMany({
      where,
      skip,
      take: Math.min(take, MaxResultsPerPage) + 1,
      orderBy,
      cursor: cursorId ? {id: cursorId} : undefined
    })
  ])

  const nodes = events.slice(0, take)
  const firstEvent = nodes[0]
  const lastEvent = nodes[nodes.length - 1]

  const hasPreviousPage = Boolean(skip)
  const hasNextPage = events.length > nodes.length

  return {
    nodes,
    totalCount,
    pageInfo: {
      hasPreviousPage,
      hasNextPage,
      startCursor: firstEvent?.id,
      endCursor: lastEvent?.id
    }
  }
}

export const getImportedEventsIds = async (event: PrismaClient['event']) => {
  const externalEventsIds = event
    .findMany({
      where: {
        externalSourceId: {
          not: null
        }
      }
    })
    .then(res => res.map(single => single.externalSourceId))

  return externalEventsIds
}
