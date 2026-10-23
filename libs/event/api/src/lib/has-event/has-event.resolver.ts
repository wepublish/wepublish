import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { CanGetEvent } from '@wepublish/permissions';
import {
  HasEvent,
  HasEventLc,
  HasOptionalEvent,
  HasOptionalEventLc,
} from './has-event.model';
import { Event } from '../event.model';
import { EventDataloaderService } from '../event-dataloader.service';
import { EventRevisionDataloaderService } from '../event-revisions.dataloader';
import { isEventEditorRequest } from '../event-editor-mode.decorator';

type EventReference = Partial<
  HasOptionalEvent & HasEvent & HasOptionalEventLc & HasEventLc
>;

type RequestContext = {
  req?: Parameters<typeof isEventEditorRequest>[0];
};

const eventIdOf = (block: EventReference) => block.eventId ?? block.eventID;

@Resolver(() => HasEvent)
export class HasEventResolver {
  constructor(protected dataloader: EventDataloaderService) {}

  @ResolveField(() => Event, { nullable: true })
  public event(@Parent() block: EventReference) {
    const id = eventIdOf(block);

    return id ? this.dataloader.load(id) : null;
  }
}

@Resolver(() => HasEventLc)
export class HasEventLcResolver extends HasEventResolver {}

@Resolver(() => HasOptionalEvent)
export class HasOptionalEventResolver {
  constructor(
    protected dataloader: EventDataloaderService,
    protected revisions: EventRevisionDataloaderService
  ) {}

  @ResolveField(() => Event, { nullable: true })
  public async event(
    @Parent() block: EventReference,
    @Context() context?: RequestContext
  ) {
    const id = eventIdOf(block);

    if (!id) {
      return null;
    }

    if (!isEventEditorRequest(context?.req, CanGetEvent)) {
      const { published } = (await this.revisions.load(id)) ?? {};

      if (!published) {
        return null;
      }
    }

    return this.dataloader.load(id);
  }
}

@Resolver(() => HasOptionalEventLc)
export class HasOptionalEventLcResolver extends HasOptionalEventResolver {}
