import {ResolveField, Resolver} from '@nestjs/graphql'
import {EventTeaser} from '../model/teaser'
import {Event, EventDataloaderService} from '@wepublish/event/api'

@Resolver(() => EventTeaser)
export class EventTeaserResolver {
  constructor(private events: EventDataloaderService) {}

  @ResolveField(() => Event)
  async event(teaser: EventTeaser) {
    const {eventID} = teaser
    return this.events.load(eventID)
  }
}
