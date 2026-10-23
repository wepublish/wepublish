import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  PartialType,
  registerEnumType,
} from '@nestjs/graphql';
import { EventScheduleType, EventStatus } from '@prisma/client';
import { BlockContentInput } from '@wepublish/block-content/api';
import { Image } from '@wepublish/image/api';
import { Tag } from '@wepublish/tag/api';
import { GraphQLSlug, PaginatedType, SortOrder } from '@wepublish/utils/api';

export enum EventSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  StartsAt = 'StartsAt',
  EndsAt = 'EndsAt',
  PublishedAt = 'PublishedAt',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
});

registerEnumType(EventSort, {
  name: 'EventSort',
});

registerEnumType(EventStatus, {
  name: 'EventStatus',
});

registerEnumType(EventScheduleType, {
  name: 'EventScheduleType',
});

@ObjectType()
export class EventImage {
  @Field()
  imageId!: string;

  @Field(() => String, { nullable: true })
  caption?: string | null;

  @Field(() => Int)
  sortOrder!: number;

  @Field()
  isMain!: boolean;

  @Field(() => Image, { nullable: true })
  image?: Image;
}

@ObjectType()
export class EventRevision {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  printDescription?: string | null;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  archivedAt?: Date | null;

  @Field(() => [EventImage])
  images!: EventImage[];

  eventId!: string;
  blocks!: unknown;
  userId?: string | null;
}

@ObjectType()
export class EventDate {
  @Field()
  id!: string;

  @Field()
  dateFrom!: Date;

  @Field()
  dateTo!: Date;

  @Field(() => String, { nullable: true })
  openingTime?: string | null;

  @Field(() => Int)
  sortOrder!: number;
}

@ObjectType()
export class EventRate {
  @Field()
  id!: string;

  @Field()
  price!: string;

  @Field(() => String, { nullable: true })
  designation?: string | null;

  @Field(() => Int)
  sortOrder!: number;
}

@ObjectType()
export class Event {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;

  @Field(() => EventStatus)
  status!: EventStatus;

  @Field(() => EventScheduleType)
  scheduleType!: EventScheduleType;

  @Field(() => Date, { nullable: true })
  dateFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  dateTo?: Date | null;

  @Field(() => [Int])
  weekDays!: number[];

  @Field(() => String, { nullable: true })
  openingTime?: string | null;

  @Field(() => String, { nullable: true })
  organizationId?: string | null;

  @Field(() => String, { nullable: true })
  placeId?: string | null;

  @Field(() => String, { nullable: true })
  audienceId?: string | null;

  @Field(() => String, { nullable: true })
  ticketingUrl?: string | null;

  @Field()
  showInPrint!: boolean;

  @Field(() => String, { nullable: true })
  seoTitle?: string | null;

  @Field(() => String, { nullable: true })
  seoDescription?: string | null;

  @Field(() => String, { nullable: true })
  socialMediaTitle?: string | null;

  @Field(() => String, { nullable: true })
  socialMediaDescription?: string | null;

  @Field(() => String, { nullable: true })
  socialMediaImageID?: string | null;

  @Field(() => Image, { nullable: true })
  socialMediaImage?: Image | null;

  @Field(() => Date, { nullable: true })
  publishedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  firstDateAt?: Date | null;

  @Field(() => Date, { nullable: true })
  lastDateAt?: Date | null;

  @Field(() => [EventDate])
  dates!: EventDate[];

  @Field(() => [EventRate])
  rates!: EventRate[];

  @Field(() => [Tag])
  tags!: Tag[];

  @Field(() => String, { nullable: true })
  url?: string | null;

  ownerId?: string | null;
  reviewRequestedAt?: Date | null;
  reviewRequestedById?: string | null;
  legacyId?: bigint | null;
}

@ObjectType()
export class PaginatedEvents extends PaginatedType(Event) {}

@ArgsType()
export class EventArgs {
  @Field({ nullable: true })
  id?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string;
}

@InputType()
export class EventFilter {
  @Field(() => [String], { nullable: true })
  ids?: string[];

  @Field(() => [String], { nullable: true })
  tagIds?: string[];

  @Field({ nullable: true })
  upcoming?: boolean;

  @Field({ nullable: true })
  from?: Date;

  @Field({ nullable: true })
  to?: Date;
}

@ArgsType()
export class EventListArgs {
  @Field(() => EventFilter, { nullable: true })
  filter?: EventFilter;

  @Field(() => EventSort, {
    nullable: true,
    defaultValue: EventSort.StartsAt,
  })
  sort?: EventSort;

  @Field(() => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(() => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}

@InputType()
export class EventDateInput {
  @Field()
  dateFrom!: Date;

  @Field()
  dateTo!: Date;

  @Field(() => String, { nullable: true })
  openingTime?: string | null;
}

@InputType()
export class EventRateInput {
  @Field()
  price!: string;

  @Field(() => String, { nullable: true })
  designation?: string | null;
}

@InputType()
export class EventInput {
  @Field(() => GraphQLSlug, { nullable: true })
  slug?: string | null;

  @Field(() => EventStatus, { nullable: true })
  status?: EventStatus | null;

  @Field(() => EventScheduleType)
  scheduleType!: EventScheduleType;

  @Field(() => Date, { nullable: true })
  dateFrom?: Date | null;

  @Field(() => Date, { nullable: true })
  dateTo?: Date | null;

  @Field(() => [Int], { nullable: true })
  weekDays?: number[] | null;

  @Field(() => String, { nullable: true })
  openingTime?: string | null;

  @Field(() => [EventDateInput], { nullable: true })
  dates?: EventDateInput[] | null;

  @Field(() => [String])
  tagIds!: string[];

  @Field(() => [EventRateInput], { nullable: true })
  rates?: EventRateInput[] | null;

  @Field(() => String, { nullable: true })
  organizationId?: string | null;

  @Field(() => String, { nullable: true })
  placeId?: string | null;

  @Field(() => String, { nullable: true })
  audienceId?: string | null;

  @Field(() => String, { nullable: true })
  ownerId?: string | null;

  @Field(() => String, { nullable: true })
  ticketingUrl?: string | null;

  @Field(() => Boolean, { nullable: true })
  showInPrint?: boolean | null;

  @Field(() => String, { nullable: true })
  seoTitle?: string | null;

  @Field(() => String, { nullable: true })
  seoDescription?: string | null;

  @Field(() => String, { nullable: true })
  socialMediaTitle?: string | null;

  @Field(() => String, { nullable: true })
  socialMediaDescription?: string | null;

  @Field(() => String, { nullable: true })
  socialMediaImageID?: string | null;
}

@InputType()
export class UpdateEventInput extends PartialType(
  OmitType(EventInput, ['scheduleType', 'tagIds'] as const),
  InputType
) {
  @Field(() => EventScheduleType, { nullable: true })
  scheduleType?: EventScheduleType | null;

  @Field(() => [String], { nullable: true })
  tagIds?: string[] | null;
}

@InputType()
export class EventImageInput {
  @Field()
  imageId!: string;

  @Field(() => String, { nullable: true })
  caption?: string | null;

  @Field(() => Boolean, { nullable: true })
  isMain?: boolean | null;
}

@InputType()
export class EventContentInput {
  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  printDescription?: string | null;

  @Field(() => [BlockContentInput])
  blocks!: BlockContentInput[];

  @Field(() => [EventImageInput], { nullable: true })
  images?: EventImageInput[] | null;
}
