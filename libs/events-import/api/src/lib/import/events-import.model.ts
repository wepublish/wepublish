import {Field, ObjectType, InputType, registerEnumType} from '@nestjs/graphql'
import {EventStatus} from '@prisma/client'

export enum ImportedEventSort {
  STARTS_AT = 'STARTS_AT',
  ENDS_AT = 'ENDS_AT',
  CREATED_AT = 'CREATED_AT',
  MODIFIED_AT = 'MODIFIED_AT'
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
  hasPreviousPage: boolean

  @Field()
  hasNextPage: boolean

  @Field()
  startCursor: string

  @Field()
  endCursor: string
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

  @Field()
  description!: string

  @Field(type => EventStatus)
  status!: EventStatus

  @Field()
  imageId!: string

  @Field()
  location!: string

  @Field()
  startsAt!: Date

  @Field({nullable: true})
  endsAt: Date
}

@ObjectType()
export class ImportedEventDocument {
  @Field(type => [Event])
  nodes!: Event[]

  @Field()
  totalCount!: number

  @Field()
  pageInfo!: PageInfo
}

@InputType()
export class ImportedEventFilter {
  @Field({nullable: true})
  name?: string
}
