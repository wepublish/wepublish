import {Field, ObjectType, InputType, registerEnumType, Int} from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'
import {Node} from 'slate'

export enum ImportedEventSort {
  STARTS_AT = 'STARTS_AT',
  ENDS_AT = 'ENDS_AT',
  CREATED_AT = 'CREATED_AT',
  MODIFIED_AT = 'MODIFIED_AT'
}

export enum EventStatus {
  SCHEDULED = 'SCHEDULED',
  RESCHEDULED = 'RESCHEDULED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED'
}

registerEnumType(ImportedEventSort, {
  name: 'ImportedEventSort'
})

registerEnumType(EventStatus, {
  name: 'EventStatus'
})

@ObjectType()
export class PageInfo {
  @Field()
  hasPreviousPage!: boolean

  @Field()
  hasNextPage!: boolean

  @Field()
  startCursor!: string

  @Field()
  endCursor!: string
}

@ObjectType()
export class Event {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  name!: string

  @Field(type => GraphQLJSON)
  description?: Node

  @Field(type => EventStatus)
  status!: EventStatus

  @Field({nullable: true})
  imageUrl?: string

  @Field()
  location!: string

  @Field()
  externalSourceId!: string

  @Field()
  externalSourceName!: string

  @Field()
  startsAt!: Date

  @Field({nullable: true})
  endsAt?: Date
}

@ObjectType()
export class ImportedEventsDocument {
  @Field(type => [Event])
  nodes!: Event[]

  @Field(type => Int)
  totalCount!: number

  @Field()
  pageInfo!: PageInfo
}

@InputType()
export class ImportedEventFilter {
  @Field({nullable: true})
  name?: string
}

@InputType()
export class SingleEventFilter {
  @Field()
  id!: string

  @Field()
  source!: string
}

@InputType()
export class CreateEventArgs {
  @Field()
  id!: string

  @Field()
  source!: string
}
