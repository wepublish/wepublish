import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  PartialType,
  PickType,
  registerEnumType
} from '@nestjs/graphql'
import {EventStatus} from '@prisma/client'
import {Image} from '@wepublish/image/api'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {PaginatedType, SortOrder} from '@wepublish/utils/api'
import {Node} from 'slate'

export enum EventSort {
  CreatedAt = 'CreatedAt',
  ModifiedAt = 'ModifiedAt',
  StartsAt = 'StartsAt',
  EndsAt = 'EndsAt'
}

registerEnumType(SortOrder, {
  name: 'SortOrder'
})

registerEnumType(EventSort, {
  name: 'EventSort'
})

registerEnumType(EventStatus, {
  name: 'EventStatus'
})

@ObjectType()
export class Event {
  @Field()
  id!: string

  @Field()
  createdAt!: Date

  @Field()
  modifiedAt!: Date

  @Field()
  startsAt!: Date

  @Field({nullable: true})
  endsAt?: Date

  @Field()
  name!: string

  @Field({nullable: true})
  location?: string

  @Field(type => GraphQLRichText, {nullable: true})
  description?: Node[]

  @Field(type => EventStatus)
  status!: EventStatus

  @Field({nullable: true})
  imageId?: string

  @Field(type => Image, {nullable: true})
  image?: Image

  @Field()
  externalSourceId!: string

  @Field()
  externalSourceName!: string
}

@ObjectType()
export class PaginatedEvents extends PaginatedType(Event) {}

@InputType()
export class EventFilter {
  @Field({nullable: true})
  upcomingOnly?: boolean

  @Field({nullable: true})
  from?: Date

  @Field({nullable: true})
  to?: Date

  @Field(type => [String], {nullable: true})
  tags?: string[]

  @Field({nullable: true})
  name?: string

  @Field({nullable: true})
  location?: string
}

@ArgsType()
export class EventListArgs {
  @Field({nullable: true})
  filter?: EventFilter

  @Field({nullable: true, defaultValue: EventSort.StartsAt})
  sortedField!: EventSort

  @Field({nullable: true, defaultValue: SortOrder.Ascending})
  order!: SortOrder

  @Field(type => Int, {nullable: true, defaultValue: 10})
  take!: number

  @Field(type => Int, {nullable: true, defaultValue: 0})
  skip!: number

  @Field({nullable: true})
  cursorId?: string
}

@ArgsType()
export class CreateEventInput extends PickType(Event, [
  'name',
  'description',
  'location',
  'imageId',
  'startsAt',
  'endsAt',
  'status'
] as const) {
  @Field(type => [String], {nullable: true})
  tagIds?: string[]
}

@ArgsType()
export class UpdateEventInput extends PartialType(CreateEventInput, ArgsType) {
  @Field()
  id!: string
}
