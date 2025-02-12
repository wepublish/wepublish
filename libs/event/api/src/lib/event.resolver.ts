import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanUpdateEvent,
  Permissions
} from '@wepublish/permissions/api'
import {Public} from '@wepublish/authentication/api'
import {
  CreateEventInput,
  Event,
  EventListArgs,
  PaginatedEvents,
  UpdateEventInput
} from './event.model'
import {EventService} from './event.service'
import {Image} from '@wepublish/image/api'
import {EventDataloaderService} from './event-dataloader.service'
import {Tag} from '@wepublish/tag/api'
import {URLAdapter} from '@wepublish/nest-modules'
import {Event as PEvent} from '@prisma/client'

@Resolver(() => Event)
export class EventResolver {
  constructor(
    private eventService: EventService,
    private eventDataloader: EventDataloaderService,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => PaginatedEvents, {
    description: `Returns a paginated list of events based on the filters given.`
  })
  public events(@Args() filter: EventListArgs) {
    return this.eventService.getEvents(filter)
  }

  @Public()
  @Query(() => Event, {description: `Returns a event by id.`})
  public event(@Args('id') id: string) {
    return this.eventDataloader.load(id)
  }

  @Mutation(() => Event, {description: `Creates a new event.`})
  @Permissions(CanCreateEvent)
  @Mutation(returns => Event, {description: `Creates a new event.`})
  public createEvent(@Args() event: CreateEventInput) {
    return this.eventService.createEvent(event)
  }

  @Mutation(() => Event, {description: `Updates an existing event.`})
  @Permissions(CanUpdateEvent)
  @Mutation(returns => Event, {description: `Updates an existing event.`})
  public updateEvent(@Args() event: UpdateEventInput) {
    return this.eventService.updateEvent(event)
  }

  @Mutation(() => Event, {description: `Deletes an existing event.`})
  @Permissions(CanDeleteEvent)
  @Mutation(returns => Event, {description: `Deletes an existing event.`})
  public deleteEvent(@Args('id') id: string) {
    return this.eventService.deleteEvent(id)
  }

  @ResolveField(() => Image, {nullable: true})
  public image(@Parent() event: Event) {
    const {imageId} = event

    if (!imageId) {
      return null
    }

    return {__typename: 'Image', id: imageId}
  }

  @ResolveField(() => [Tag], {nullable: true})
  async tags(@Parent() parent: Event) {
    const {id: eventId} = parent
    const tagIds = await this.eventService.getEventTagIds(eventId)
    return tagIds.map(({id}) => ({__typename: 'Tag', id}))
  }

  @ResolveField(() => String, {nullable: true})
  async url(@Parent() parent: PEvent) {
    return this.urlAdapter.getEventURL(parent)
  }
}
