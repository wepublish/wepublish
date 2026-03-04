import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, Prisma, PrismaClient } from '@prisma/client';
import {
  getMaxTake,
  graphQLSortOrderToPrisma,
  PrimeDataLoader,
  SortOrder,
} from '@wepublish/utils/api';
import { EventDataloaderService } from './event-dataloader.service';
import {
  CreateEventInput,
  EventFilter,
  EventListArgs,
  EventSort,
  UpdateEventInput,
} from './event.model';

@Injectable()
export class EventService {
  constructor(private prisma: PrismaClient) {}

  @PrimeDataLoader(EventDataloaderService)
  async getEvents({
    filter,
    cursorId,
    sort = EventSort.StartsAt,
    order = SortOrder.Ascending,
    take = 10,
    skip,
  }: EventListArgs) {
    const orderBy = createEventOrder(sort, order);
    const where = createEventFilter(filter);

    const [totalCount, events] = await Promise.all([
      this.prisma.event.count({
        where,
        orderBy,
      }),
      this.prisma.event.findMany({
        where,
        skip,
        take: getMaxTake(take) + 1,
        orderBy,
        cursor: cursorId ? { id: cursorId } : undefined,
      }),
    ]);

    const nodes = events.slice(0, getMaxTake(take));
    const firstEvent = nodes[0];
    const lastEvent = nodes[nodes.length - 1];

    const hasPreviousPage = Boolean(skip);
    const hasNextPage = events.length > nodes.length;

    return {
      nodes,
      totalCount,
      pageInfo: {
        hasPreviousPage,
        hasNextPage,
        startCursor: firstEvent?.id,
        endCursor: lastEvent?.id,
      },
    };
  }

  @PrimeDataLoader(EventDataloaderService)
  async getEventById(id: string) {
    const event = await this.prisma.event.findUnique({
      where: {
        id,
      },
    });

    if (!event) {
      throw new NotFoundException();
    }

    return event;
  }

  @PrimeDataLoader(EventDataloaderService)
  async updateEvent({ id, tagIds, description, ...input }: UpdateEventInput) {
    const oldEvent = await this.prisma.event.findUnique({
      where: { id },
    });

    if (!oldEvent) {
      throw new NotFoundException();
    }

    validateEvent({ ...oldEvent, ...input });

    return this.prisma.event.update({
      where: {
        id,
      },
      data: {
        ...input,
        description: description as any[],
        tags:
          tagIds ?
            {
              connectOrCreate: tagIds.map(tagId => ({
                where: {
                  eventId_tagId: {
                    eventId: id,
                    tagId,
                  },
                },
                create: {
                  tagId,
                },
              })),
              deleteMany: {
                eventId: id,
                tagId: {
                  notIn: tagIds,
                },
              },
            }
          : undefined,
      },
    });
  }

  @PrimeDataLoader(EventDataloaderService)
  async createEvent({ tagIds, description, ...input }: CreateEventInput) {
    validateEvent(input);

    return this.prisma.event.create({
      data: {
        ...input,
        description: description as any[],
        tags:
          tagIds?.length ?
            {
              createMany: {
                data: tagIds?.map(tagId => ({ tagId })),
              },
            }
          : undefined,
      },
    });
  }

  async deleteEvent(id: string) {
    return this.prisma.event.delete({
      where: {
        id,
      },
    });
  }
}

const validateEvent = ({
  startsAt,
  endsAt,
}:
  | Pick<Event, 'startsAt' | 'endsAt'>
  | Pick<CreateEventInput, 'startsAt' | 'endsAt'>) => {
  if (endsAt && new Date(startsAt) > new Date(endsAt)) {
    throw new BadRequestException('endsAt can not be earlier than startsAt');
  }
};

export const createEventOrder = (
  field: EventSort,
  sortOrder: SortOrder
): Prisma.EventFindManyArgs['orderBy'] => {
  switch (field) {
    case EventSort.ModifiedAt:
      return {
        modifiedAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case EventSort.CreatedAt:
      return {
        createdAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case EventSort.EndsAt:
      return {
        endsAt: graphQLSortOrderToPrisma(sortOrder),
      };

    case EventSort.StartsAt:
    default:
      return {
        startsAt: graphQLSortOrderToPrisma(sortOrder),
      };
  }
};

const createTagFilter = (
  filter?: Partial<EventFilter>
): Prisma.EventWhereInput => {
  if (filter?.tags?.length) {
    return {
      tags: {
        some: {
          tagId: {
            in: filter?.tags,
          },
        },
      },
    };
  }

  return {};
};

const createUpcomingOnlyFilter = (
  filter?: Partial<EventFilter>
): Prisma.EventWhereInput => {
  if (filter?.upcomingOnly) {
    return {
      OR: [
        {
          startsAt: {
            gte: new Date(),
          },
        },
        {
          endsAt: {
            gte: new Date(),
          },
        },
      ],
    };
  }

  return {};
};

const createFromFilter = (
  filter?: Partial<EventFilter>
): Prisma.EventWhereInput => {
  if (filter?.from) {
    return {
      OR: [
        {
          startsAt: {
            gte: filter.from,
          },
        },
        {
          endsAt: {
            gte: filter.from,
          },
        },
      ],
    };
  }

  return {};
};

const createToFilter = (
  filter?: Partial<EventFilter>
): Prisma.EventWhereInput => {
  if (filter?.to) {
    return {
      OR: [
        {
          startsAt: {
            lte: filter.to,
          },
        },
        {
          endsAt: {
            lte: filter.to,
          },
        },
      ],
    };
  }

  return {};
};

const createNameFilter = (
  filter?: Partial<EventFilter>
): Prisma.EventWhereInput => {
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

const createLocationFilter = (
  filter?: Partial<EventFilter>
): Prisma.EventWhereInput => {
  if (filter?.location) {
    return {
      OR: [
        {
          location: {
            contains: filter.location,
            mode: 'insensitive',
          },
        },
      ],
    };
  }

  return {};
};

const createEventFilter = (
  filter?: Partial<EventFilter>
): Prisma.EventWhereInput => ({
  AND: [
    createUpcomingOnlyFilter(filter),
    createFromFilter(filter),
    createToFilter(filter),
    createTagFilter(filter),
    createNameFilter(filter),
    createLocationFilter(filter),
  ],
});
