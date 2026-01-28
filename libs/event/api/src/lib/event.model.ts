import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType,
} from '@nestjs/graphql';
import { EventStatus } from '@prisma/client';
import { Image } from '@wepublish/image/api';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { PaginatedType, SortOrder } from '@wepublish/utils/api';
import { Descendant } from 'slate';

export enum EventSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  StartsAt = 'StartsAt',
  EndsAt = 'EndsAt',
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

@ObjectType()
export class Event {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  startsAt!: Date;

  @Field({ nullable: true })
  endsAt?: Date;

  @Field()
  name!: string;

  @Field({ nullable: true })
  lead?: string;

  @Field({ nullable: true })
  location?: string;

  @Field(type => GraphQLRichText, { nullable: true })
  description?: Descendant[];

  @Field(type => EventStatus)
  status!: EventStatus;

  @Field({ nullable: true })
  imageId?: string;

  @Field(type => Image, { nullable: true })
  image?: Image;

  @Field({ nullable: true })
  externalSourceId?: string;

  @Field({ nullable: true })
  externalSourceName?: string;

  @Field()
  url!: string;
}

@ObjectType()
export class PaginatedEvents extends PaginatedType(Event) {}

@InputType()
export class EventFilter {
  @Field({ nullable: true })
  upcomingOnly?: boolean;

  @Field({ nullable: true })
  from?: Date;

  @Field({ nullable: true })
  to?: Date;

  @Field(type => [String], { nullable: true })
  tags?: string[];

  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  location?: string;
}

@ArgsType()
export class EventListArgs {
  @Field(type => EventFilter, { nullable: true })
  filter?: EventFilter;

  @Field(type => EventSort, {
    nullable: true,
    defaultValue: EventSort.StartsAt,
  })
  sort?: EventSort;

  @Field(type => SortOrder, {
    nullable: true,
    defaultValue: SortOrder.Ascending,
  })
  order?: SortOrder;

  @Field(type => Int, { nullable: true, defaultValue: 10 })
  take?: number;

  @Field(type => Int, { nullable: true, defaultValue: 0 })
  skip?: number;

  @Field({ nullable: true })
  cursorId?: string;
}

@ArgsType()
export class CreateEventInput extends PickType(
  Event,
  [
    'name',
    'lead',
    'description',
    'location',
    'imageId',
    'startsAt',
    'endsAt',
  ] as const,
  ArgsType
) {
  @Field(type => [String], { nullable: true })
  tagIds?: string[];

  @Field(type => EventStatus, {
    defaultValue: EventStatus.Scheduled,
  })
  status?: EventStatus;
}

@ArgsType()
export class UpdateEventInput extends PartialType(CreateEventInput, ArgsType) {
  @Field()
  id!: string;
}
