import { forwardRef, Inject } from '@nestjs/common';
import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { Event, EventService } from '@wepublish/event/api';
import { EventBlock } from './event-block.model';

@Resolver(() => EventBlock)
export class EventBlockResolver {
  constructor(
    @Inject(forwardRef(() => EventService))
    private eventService: EventService
  ) {}

  @ResolveField(() => [Event], { nullable: true })
  public events(@Parent() { filter }: EventBlock) {
    return this.eventService.getPublicEventsForBlock(filter ?? {});
  }
}
