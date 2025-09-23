import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import {
  HasEvent,
  HasEventLc,
  HasOptionalEvent,
  HasOptionalEventLc,
} from './has-event.model';
import { Event } from '../event.model';
import { EventDataloaderService } from '../event-dataloader.service';

@Resolver(() => HasEvent)
export class HasEventResolver {
  constructor(private dataloader: EventDataloaderService) {}

  @ResolveField(() => Event, { nullable: true })
  public event(
    @Parent()
    block: HasOptionalEvent | HasEvent | HasOptionalEventLc | HasEventLc
  ) {
    const id =
      'eventId' in block ? block.eventId
      : 'eventID' in block ? block.eventID
      : null;

    if (!id) {
      return null;
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasEventLc)
export class HasEventLcResolver extends HasEventResolver {}

@Resolver(() => HasOptionalEvent)
export class HasOptionalEventResolver extends HasEventResolver {}

@Resolver(() => HasOptionalEventLc)
export class HasOptionalEventLcResolver extends HasEventResolver {}
