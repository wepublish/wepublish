import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanUpdateEvent,
} from '@wepublish/permissions';
import { Public } from '@wepublish/authentication/api';
import {
  CreateEventInput,
  Event,
  EventListArgs,
  PaginatedEvents,
  UpdateEventInput,
} from './event.model';
import { EventService } from './event.service';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { EventDataloaderService } from './event-dataloader.service';
import { EventTagDataloader, Tag } from '@wepublish/tag/api';
import { URLAdapter } from '@wepublish/nest-modules';
import { Event as PEvent } from '@prisma/client';
import { Permissions } from '@wepublish/permissions/api';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => Event)
export class EventResolver {
  constructor(
    private eventService: EventService,
    private eventDataloader: EventDataloaderService,
    private urlAdapter: URLAdapter,
    private tagDataLoader: EventTagDataloader,
    private imageDataloaderService: ImageDataloaderService
  ) {}

  @Public()
  @Query(() => PaginatedEvents, {
    description: `Returns a paginated list of events based on the filters given.`,
  })
  public events(@Args() filter: EventListArgs) {
    return this.eventService.getEvents(filter);
  }

  @Public()
  @Query(() => Event, { description: `Returns an event by id.` })
  public async event(@Args('id') id: string) {
    const event = await this.eventDataloader.load(id);

    if (!event) {
      throw new NotFoundException(`Event with id ${id} was not found.`);
    }

    return event;
  }

  @Permissions(CanCreateEvent)
  @Mutation(returns => Event, { description: `Creates a new event.` })
  public createEvent(@Args() event: CreateEventInput) {
    return this.eventService.createEvent(event);
  }

  @Permissions(CanUpdateEvent)
  @Mutation(returns => Event, { description: `Updates an existing event.` })
  public updateEvent(@Args() event: UpdateEventInput) {
    return this.eventService.updateEvent(event);
  }

  @Permissions(CanDeleteEvent)
  @Mutation(returns => Event, { description: `Deletes an existing event.` })
  public deleteEvent(@Args('id') id: string) {
    return this.eventService.deleteEvent(id);
  }

  @ResolveField(() => Image, { nullable: true })
  public image(@Parent() event: Event) {
    const { imageId } = event;

    if (!imageId) {
      return null;
    }

    return this.imageDataloaderService.load(imageId);
  }

  @ResolveField(() => [Tag], { nullable: true })
  async tags(@Parent() parent: Event) {
    return this.tagDataLoader.load(parent.id);
  }

  @ResolveField(() => String, { nullable: true })
  async url(@Parent() parent: PEvent) {
    return this.urlAdapter.getEventURL(parent);
  }
}
