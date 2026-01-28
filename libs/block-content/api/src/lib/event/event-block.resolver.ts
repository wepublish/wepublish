import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { EventBlock } from './event-block.model';
import { PrimeDataLoader } from '@wepublish/utils/api';
import { Event, EventDataloaderService } from '@wepublish/event/api';
import { PrismaClient } from '@prisma/client';

@Resolver(() => EventBlock)
export class EventBlockResolver {
  constructor(private prisma: PrismaClient) {}

  @ResolveField(() => [Event], { nullable: true })
  @PrimeDataLoader(EventDataloaderService)
  public events(@Parent() { filter }: EventBlock) {
    return this.prisma.event.findMany({
      where: {
        OR: [
          {
            tags: {
              some: {
                tagId: {
                  in: filter.tags ?? [],
                },
              },
            },
          },
          {
            id: {
              in: filter.events ?? [],
            },
          },
        ],
      },
    });
  }
}
