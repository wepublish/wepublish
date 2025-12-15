import {
  ArgsType,
  Field,
  InputType,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { EventStatus } from '@prisma/client';
import { Event } from '@wepublish/event/api';
import { PaginatedType } from '@wepublish/utils/api';

export enum ImportedEventSort {
  STARTS_AT = 'STARTS_AT',
  ENDS_AT = 'ENDS_AT',
  CREATED_AT = 'CREATED_AT',
  MODIFIED_AT = 'MODIFIED_AT',
}

registerEnumType(ImportedEventSort, {
  name: 'ImportedEventSort',
});

registerEnumType(EventStatus, {
  name: 'EventStatus',
});

@ObjectType()
export class EventFromSource extends OmitType(Event, [
  'imageId',
  'image',
  'url',
] as const) {
  @Field({ nullable: true })
  imageUrl?: string;
}

@ObjectType()
export class PaginatedEventsFromSources extends PaginatedType(
  EventFromSource
) {}

@InputType()
export class ImportedEventFilter {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  from?: string;

  @Field({ nullable: true })
  to?: string;

  @Field(type => [String], { nullable: 'itemsAndList' })
  providers?: string[];

  @Field({ nullable: true })
  location?: string;
}

@InputType()
export class SingleEventFilter {
  @Field()
  id!: string;

  @Field()
  source!: string;
}

@ArgsType()
export class ImportEventArgs {
  @Field()
  id!: string;

  @Field()
  source!: string;
}
