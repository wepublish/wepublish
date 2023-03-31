import {Field, ObjectType, InputType, registerEnumType} from '@nestjs/graphql'
import {EventStatus} from '@prisma/client'

// const EventStatus = {
//   Cancelled: 'Cancelled',
//   Rescheduled: 'Rescheduled',
//   Postponed: 'Postponed',
//   Scheduled: 'Scheduled'
// }

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
  name!: string

  @Field()
  description!: string

  @Field(type => EventStatus)
  status!: EventStatus

  @Field()
  imageId!: string

  // @Field()
  // image!: string

  @Field()
  location!: string

  @Field()
  startsAt!: Date

  @Field()
  endsAt!: Date

  // @Field()
  // slug!: string

  // @Field(type => ConsentValue)
  // defaultValue!: ConsentValue

  // id: string
  // createdAt: Date
  // modifiedAt: Date
  // name: string
  // description: Prisma.JsonValue[]
  // status: EventStatus
  // imageId: string | null
  // location: string | null
  // startsAt: Date
  // endsAt: Date | null
}

// @InputType()
// export class ConsentInput {
//   @Field()
//   name!: string

//   @Field()
//   slug!: string

//   @Field(type => ConsentValue)
//   defaultValue!: ConsentValue
// }

// @InputType()
// export class ConsentFilter {
//   @Field({nullable: true})
//   name?: string

//   @Field({nullable: true})
//   slug?: string

//   @Field(type => ConsentValue, {nullable: true})
//   defaultValue?: ConsentValue
// }
