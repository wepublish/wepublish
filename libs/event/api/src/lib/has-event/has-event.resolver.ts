import { Context, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { AuthSession } from '@wepublish/authentication/api';
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
import { canReachLoadedEvent } from '../event-reach';
import { PlaceDataloaderService } from '../place/place-dataloader.service';

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
    protected revisions: EventRevisionDataloaderService,
    protected places: PlaceDataloaderService
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

    const { published } = (await this.revisions.load(id)) ?? {};

    if (published) {
      return this.dataloader.load(id);
    }

    if (!isEventEditorRequest(context?.req, CanGetEvent)) {
      return null;
    }

    const event = await this.dataloader.load(id);
    const session = context?.req?.user as AuthSession | undefined;

    return event && (await canReachLoadedEvent(session, event, this.places)) ?
        event
      : null;
  }
}

@Resolver(() => HasOptionalEventLc)
export class HasOptionalEventLcResolver extends HasOptionalEventResolver {}
