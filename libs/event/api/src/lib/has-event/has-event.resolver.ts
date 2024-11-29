import {Parent, ResolveField, Resolver} from '@nestjs/graphql'
import {HasEvent} from './has-event.model'
import {Event} from '../event.model'
import {EventDataloaderService} from '../event-dataloader.service'

@Resolver(() => HasEvent)
export class HasEventResolver {
  constructor(private dataloader: EventDataloaderService) {}

  @ResolveField(() => Event, {nullable: true})
  public event(@Parent() block: HasEvent) {
    const {eventID} = block

    if (!eventID) {
      return null
    }

    return this.dataloader.load(eventID)
  }
}
