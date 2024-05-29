import {Args, Mutation, Parent, Query, ResolveField, Resolver} from '@nestjs/graphql'
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanUpdateEvent,
  Permissions
} from '@wepublish/permissions/api'
import {
  CreateEventInput,
  Event,
  EventListArgs,
  PaginatedEvents,
  UpdateEventInput
} from './event.model'
import {EventService} from './event.service'
import {Image, ImageDataloaderService} from '@wepublish/image/api'
import {EventDataloaderService} from './event-dataloader.service'

@Resolver(() => Event)
export class EventResolver {
  constructor(
    private eventService: EventService,
    private eventDataloader: EventDataloaderService,
    private imageDataloader: ImageDataloaderService
  ) {}

  @Query(returns => PaginatedEvents, {
    description: `Returns a paginated list of events based on the filters given.`
  })
  public events(@Args() filter: EventListArgs) {
    return this.eventService.getEvents(filter)
  }

  @Query(returns => Event, {description: `Returns a event by id.`})
  public event(@Args('id') id: string) {
    return this.eventDataloader.load(id)
  }

  @Mutation(returns => Event, {description: `Creates a new event.`})
  @Permissions(CanCreateEvent)
  public createEvent(@Args() event: CreateEventInput) {
    return this.eventService.createEvent(event)
  }

  @Mutation(returns => Event, {description: `Updates an existing event.`})
  @Permissions(CanUpdateEvent)
  public updateEvent(@Args() event: UpdateEventInput) {
    return this.eventService.updateEvent(event)
  }

  @Mutation(returns => Event, {description: `Deletes an existing event.`})
  @Permissions(CanDeleteEvent)
  public deleteEvent(@Args('id') id: string) {
    return this.eventService.deleteEvent(id)
  }

  @ResolveField(returns => Image, {nullable: true})
  public image(@Parent() event: Event) {
    const {imageId} = event

    if (!imageId) {
      return null
    }

    return this.imageDataloader.load(imageId)
  }
}
