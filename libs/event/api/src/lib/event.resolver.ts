import {
  Args,
  Int,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import {
  Event as PEvent,
  EventRevision as PEventRevision,
} from '@prisma/client';
import {
  AuthSession,
  CurrentUser,
  Public,
} from '@wepublish/authentication/api';
import { Image, ImageDataloaderService } from '@wepublish/image/api';
import { URLAdapter } from '@wepublish/nest-modules';
import {
  CanCreateEvent,
  CanDeleteEvent,
  CanGetEvent,
  CanGetEvents,
  CanPublishEvent,
  CanUpdateEvent,
} from '@wepublish/permissions';
import {
  hasPermission,
  Permissions,
  permissionsOf,
} from '@wepublish/permissions/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { EventTagDataloader, Tag } from '@wepublish/tag/api';
import { User, UserDataloaderService } from '@wepublish/user/api';
import {
  EventDatesDataloader,
  EventRatesDataloader,
  EventRevisionImagesDataloader,
} from './event-details.dataloader';
import { EventDataloaderService } from './event-dataloader.service';
import { EventOccurrenceSummaryDataloader } from './event-occurrence-summary.dataloader';
import { EventEditorMode } from './event-editor-mode.decorator';
import { canReachLoadedEvent } from './event-reach';
import { eventViewerPermissions } from './event-scope';
import { EventRevisionDataloaderService } from './event-revisions.dataloader';
import {
  Event,
  EventArgs,
  EventContentInput,
  EventDate,
  EventInput,
  EventListArgs,
  EventRate,
  EventRevision,
  EventViewerPermissions,
  PaginatedEvents,
  UpdateEventInput,
} from './event.model';
import { EventService } from './event.service';
import {
  AgendaListArgs,
  Occurrence,
  PaginatedOccurrences,
} from './occurrence.model';
import { PlaceDataloaderService } from './place/place-dataloader.service';

type Session = AuthSession | undefined;

const firstRichText = (blocks: unknown): RichtextJSONDocument | null => {
  const block = (Array.isArray(blocks) ? blocks : []).find(
    candidate =>
      candidate &&
      typeof candidate === 'object' &&
      (candidate as { type?: unknown }).type === 'richText'
  ) as { richText?: RichtextJSONDocument } | undefined;

  return block?.richText ?? null;
};

@Resolver(() => Event)
export class EventResolver {
  constructor(
    private eventService: EventService,
    private revisions: EventRevisionDataloaderService,
    private revisionImages: EventRevisionImagesDataloader,
    private imageDataloader: ImageDataloaderService,
    private places: PlaceDataloaderService,
    private tagDataloader: EventTagDataloader,
    private datesDataloader: EventDatesDataloader,
    private ratesDataloader: EventRatesDataloader,
    private occurrenceSummaries: EventOccurrenceSummaryDataloader,
    private users: UserDataloaderService,
    private urlAdapter: URLAdapter
  ) {}

  @Public()
  @Query(() => Event, {
    description: `Returns a published event by id or slug. With the preview header and CAN_GET_EVENT it returns any event you may open in the editor.`,
  })
  public event(
    @Args() args: EventArgs,
    @CurrentUser() session: Session,
    @EventEditorMode(CanGetEvent) editorMode: boolean
  ) {
    return this.eventService.getEvent(args, session, editorMode);
  }

  @Public()
  @Query(() => PaginatedEvents, {
    description: `Returns a paginated list of published events. With the preview header and CAN_GET_EVENTS it lists the events you manage.`,
  })
  public events(
    @Args() args: EventListArgs,
    @CurrentUser() session: Session,
    @EventEditorMode(CanGetEvents) editorMode: boolean
  ) {
    return this.eventService.getEvents(args, session, editorMode);
  }

  @Public()
  @Query(() => PaginatedOccurrences, {
    description: `Returns the agenda: one row per occurrence of a published event, ordered by its start. With the preview header and CAN_GET_EVENTS it lists the occurrences of the events you manage.`,
  })
  public agenda(
    @Args() args: AgendaListArgs,
    @CurrentUser() session: Session,
    @EventEditorMode(CanGetEvents) editorMode: boolean
  ) {
    return this.eventService.getAgenda(args, session, editorMode);
  }

  @Permissions(CanCreateEvent)
  @Mutation(() => Event, {
    description: `Creates an event with its facts and a first draft of its content.`,
  })
  public createEvent(
    @Args('input') input: EventInput,
    @Args('content') content: EventContentInput,
    @CurrentUser() session: Session
  ) {
    return this.eventService.createEvent(input, content, session);
  }

  @Permissions(CanUpdateEvent)
  @Mutation(() => Event, {
    description: `Updates the facts of an event. They take effect immediately.`,
  })
  public updateEvent(
    @Args('id') id: string,
    @Args('input') input: UpdateEventInput,
    @CurrentUser() session: Session
  ) {
    return this.eventService.updateEvent(id, input, session);
  }

  @Permissions(CanUpdateEvent)
  @Mutation(() => Event, {
    description: `Writes the content of an event into a new draft revision.`,
  })
  public updateEventContent(
    @Args('id') id: string,
    @Args('input') input: EventContentInput,
    @CurrentUser() session: Session
  ) {
    return this.eventService.updateEventContent(id, input, session);
  }

  @Permissions(CanPublishEvent)
  @Mutation(() => Event, {
    description: `Publishes the draft of an event, at publishAt when given.`,
  })
  public publishEvent(
    @Args('id') id: string,
    @Args('publishAt', { type: () => Date, nullable: true })
    publishAt: Date | null | undefined,
    @CurrentUser() session: Session
  ) {
    return this.eventService.publishEvent(id, publishAt, session);
  }

  @Permissions(CanPublishEvent)
  @Mutation(() => Event, {
    description: `Unpublishes an event. Its latest revision stays as draft.`,
  })
  public unpublishEvent(
    @Args('id') id: string,
    @CurrentUser() session: Session
  ) {
    return this.eventService.unpublishEvent(id, session);
  }

  @Permissions(CanDeleteEvent)
  @Mutation(() => Event, { description: `Deletes an event.` })
  public deleteEvent(@Args('id') id: string, @CurrentUser() session: Session) {
    return this.eventService.deleteEvent(id, session);
  }

  @Permissions(CanCreateEvent)
  @Mutation(() => Event, {
    description: `Copies an event you may file under its organisation into a new unpublished event that you own.`,
  })
  public duplicateEvent(
    @Args('id') id: string,
    @CurrentUser() session: Session
  ) {
    return this.eventService.duplicateEvent(id, session);
  }

  @Permissions(CanUpdateEvent)
  @Mutation(() => Event, {
    description: `Asks the validators to review the draft of an event you may edit but not publish.`,
  })
  public requestEventReview(
    @Args('id') id: string,
    @CurrentUser() session: Session
  ) {
    return this.eventService.requestEventReview(id, session);
  }

  @Permissions(CanUpdateEvent)
  @Mutation(() => Event, {
    description: `Withdraws the pending review request of an event you may edit.`,
  })
  public withdrawEventReview(
    @Args('id') id: string,
    @CurrentUser() session: Session
  ) {
    return this.eventService.withdrawEventReview(id, session);
  }

  @ResolveField(() => EventRevision, { nullable: true })
  async latest(
    @Parent() event: PEvent,
    @EventEditorMode(CanGetEvent) editorMode: boolean,
    @CurrentUser() session: Session
  ) {
    return this.displayedRevision(event, editorMode, session);
  }

  @ResolveField(() => EventRevision, { nullable: true })
  async published(@Parent() event: PEvent) {
    return (await this.revisions.load(event.id))?.published ?? null;
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => EventRevision, { nullable: true })
  async draft(@Parent() event: PEvent, @CurrentUser() session: Session) {
    if (!(await this.mayReadEditorView(event, session))) {
      return null;
    }

    return (await this.revisions.load(event.id))?.draft ?? null;
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => EventRevision, { nullable: true })
  async pending(@Parent() event: PEvent, @CurrentUser() session: Session) {
    if (!(await this.mayReadEditorView(event, session))) {
      return null;
    }

    return (await this.revisions.load(event.id))?.pending ?? null;
  }

  @ResolveField(() => String, { nullable: true })
  async name(
    @Parent() event: PEvent,
    @EventEditorMode(CanGetEvent) editorMode: boolean,
    @CurrentUser() session: Session
  ) {
    return (
      (await this.displayedRevision(event, editorMode, session))?.name ?? null
    );
  }

  @ResolveField(() => GraphQLRichText, { nullable: true })
  async description(
    @Parent() event: PEvent,
    @EventEditorMode(CanGetEvent) editorMode: boolean,
    @CurrentUser() session: Session
  ) {
    return firstRichText(
      (await this.displayedRevision(event, editorMode, session))?.blocks
    );
  }

  @ResolveField(() => Image, { nullable: true })
  async image(
    @Parent() event: PEvent,
    @EventEditorMode(CanGetEvent) editorMode: boolean,
    @CurrentUser() session: Session
  ) {
    const revision = await this.displayedRevision(event, editorMode, session);

    if (!revision) {
      return null;
    }

    const images = (await this.revisionImages.load(revision.id)) ?? [];
    const main =
      images.find(({ isMain }) => isMain) ??
      [...images].sort((a, b) => a.sortOrder - b.sortOrder)[0];

    return main ? this.imageDataloader.load(main.imageId) : null;
  }

  @ResolveField(() => String, { nullable: true })
  async location(@Parent() { placeId }: PEvent) {
    if (!placeId) {
      return null;
    }

    return (await this.places.load(placeId))?.name ?? null;
  }

  @ResolveField(() => Date, { nullable: true })
  startsAt(@Parent() { firstDateAt }: PEvent) {
    return firstDateAt;
  }

  @ResolveField(() => Date, { nullable: true })
  endsAt(@Parent() { lastDateAt }: PEvent) {
    return lastDateAt;
  }

  @ResolveField(() => String, { nullable: true })
  url(@Parent() event: PEvent) {
    return this.urlAdapter.getEventURL(event);
  }

  @ResolveField(() => [Tag])
  async tags(@Parent() { id }: PEvent) {
    return (await this.tagDataloader.load(id)) ?? [];
  }

  @ResolveField(() => [EventDate])
  async dates(@Parent() { id }: PEvent) {
    return (await this.datesDataloader.load(id)) ?? [];
  }

  @ResolveField(() => [EventRate])
  async rates(@Parent() { id }: PEvent) {
    return (await this.ratesDataloader.load(id)) ?? [];
  }

  @ResolveField(() => Image, { nullable: true })
  socialMediaImage(@Parent() { socialMediaImageID }: PEvent) {
    return socialMediaImageID ?
        this.imageDataloader.load(socialMediaImageID)
      : null;
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => String, { nullable: true })
  async ownerId(@Parent() event: PEvent, @CurrentUser() session: Session) {
    return (await this.mayReadEditorView(event, session)) ?
        event.ownerId
      : null;
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => Date, { nullable: true })
  async reviewRequestedAt(
    @Parent() event: PEvent,
    @CurrentUser() session: Session
  ) {
    return (await this.mayReadEditorView(event, session)) ?
        event.reviewRequestedAt
      : null;
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => String, { nullable: true })
  async reviewRequestedById(
    @Parent() event: PEvent,
    @CurrentUser() session: Session
  ) {
    return (await this.mayReadEditorView(event, session)) ?
        event.reviewRequestedById
      : null;
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => User, { nullable: true })
  async owner(@Parent() event: PEvent, @CurrentUser() session: Session) {
    if (!event.ownerId || !(await this.mayReadEditorView(event, session))) {
      return null;
    }

    return this.users.load(event.ownerId);
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => User, { nullable: true })
  async reviewRequestedBy(
    @Parent() event: PEvent,
    @CurrentUser() session: Session
  ) {
    if (
      !event.reviewRequestedById ||
      !(await this.mayReadEditorView(event, session))
    ) {
      return null;
    }

    return this.users.load(event.reviewRequestedById);
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => EventViewerPermissions, {
    nullable: true,
    description: `What you may do with this event. Null outside its editor view.`,
  })
  async viewerCan(@Parent() event: PEvent, @CurrentUser() session: Session) {
    if (!(await this.mayReadEditorView(event, session))) {
      return null;
    }

    const place =
      event.placeId ? ((await this.places.load(event.placeId)) ?? null) : null;
    const draft = (await this.revisions.load(event.id))?.draft;

    return eventViewerPermissions(session, { ...event, place }, !!draft);
  }

  @ResolveField(() => Occurrence, {
    nullable: true,
    description: `The earliest occurrence that has not ended.`,
  })
  async nextOccurrence(@Parent() { id }: PEvent) {
    return (await this.occurrenceSummaries.load(id))?.next ?? null;
  }

  @ResolveField(() => Int, {
    description: `How many occurrences have not ended, the next one included.`,
  })
  async upcomingOccurrenceCount(@Parent() { id }: PEvent) {
    return (await this.occurrenceSummaries.load(id))?.upcomingCount ?? 0;
  }

  @Permissions(CanGetEvent)
  @ResolveField(() => String, { nullable: true })
  async legacyId(@Parent() event: PEvent, @CurrentUser() session: Session) {
    if (!(await this.mayReadEditorView(event, session))) {
      return null;
    }

    return event.legacyId?.toString() ?? null;
  }

  private async mayReadEditorView(event: PEvent, session: Session) {
    return (
      hasPermission(CanGetEvent, permissionsOf(session)) &&
      (await canReachLoadedEvent(session, event, this.places))
    );
  }

  private async displayedRevision(
    event: PEvent,
    editorMode: boolean,
    session: Session
  ): Promise<PEventRevision | null> {
    const { draft, pending, published } =
      (await this.revisions.load(event.id)) ?? {};
    const showsEditorView =
      editorMode && (await canReachLoadedEvent(session, event, this.places));

    return (
      (showsEditorView ? (draft ?? pending ?? published) : published) ?? null
    );
  }
}

@Resolver(() => Occurrence)
export class OccurrenceResolver {
  constructor(private events: EventDataloaderService) {}

  @ResolveField(() => Event)
  event(@Parent() { eventId }: Occurrence) {
    return this.events.load(eventId);
  }
}
