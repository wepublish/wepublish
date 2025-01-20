import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanUpdateEvent,
  Permissions,
  Public
} from '@wepublish/permissions/api'
import {
  CreateEventInput,
  EventV2,
  EventId,
  EventListArgs,
  PaginatedEvents,
  Tag,
  UpdateEventInput
} from './event.model'
import {EventService} from './event.service'
import {Image} from '@wepublish/image/api'
import {EventDataloaderService} from './event-dataloader.service'

@Resolver(() => EventV2)
export class EventResolver {
  constructor(
    private eventService: EventService,
    private eventDataloader: EventDataloaderService
  ) {}

  @Public()
  @Query(returns => PaginatedEvents, {
    description: `Returns a paginated list of events based on the filters given.`
  })
  public events(@Args() filter: EventListArgs) {
    return this.eventService.getEvents(filter)
  }

  @Public()
  @Query(returns => EventV2, {description: `Returns a event by id.`})
  public event(@Args() {id}: EventId) {
    return this.eventDataloader.load(id)
  }

  @Permissions(CanCreateEvent)
  @Mutation(returns => EventV2, {description: `Creates a new event.`})
  public createEvent(@Args() event: CreateEventInput) {
    return this.eventService.createEvent(event)
  }

  @Permissions(CanUpdateEvent)
  @Mutation(returns => EventV2, {description: `Updates an existing event.`})
  public updateEvent(@Args() event: UpdateEventInput) {
    return this.eventService.updateEvent(event)
  }

  @Permissions(CanDeleteEvent)
  @Mutation(returns => EventV2, {description: `Deletes an existing event.`})
  public deleteEvent(@Args('id') id: string) {
    return this.eventService.deleteEvent(id)
  }

  @ResolveField(returns => Image, {nullable: true})
  public image(@Parent() event: EventV2) {
    const {imageId} = event

    if (!imageId) {
      return null
    }

    return {__typename: 'Image', id: imageId}
  }

  @ResolveField(() => [Tag], {nullable: true})
  async tags(@Parent() parent: EventV2) {
    const {id: eventId} = parent
    const tagIds = await this.eventService.getEventTagIds(eventId)
    return tagIds.map(({id}) => ({__typename: 'Tag', id}))
  }
}
