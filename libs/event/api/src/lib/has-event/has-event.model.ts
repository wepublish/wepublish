import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Event} from '../event.model'

@InterfaceType()
export abstract class HasOptionalEvent {
  @Field(() => ID, {nullable: true})
  eventID?: string

  @Field(() => Event, {nullable: true})
  event?: Event
}

@InterfaceType()
export abstract class HasEvent {
  @Field(() => ID)
  eventID!: string

  @Field(() => Event)
  event!: Event
}

// New Style

@InterfaceType()
export abstract class HasEventLc {
  @Field(() => ID)
  eventId!: string

  @Field(() => Event)
  event!: Event
}

@InterfaceType()
export abstract class HasOptionalEventLc {
  @Field(() => ID, {nullable: true})
  eventId?: string

  @Field(() => Event, {nullable: true})
  event?: Event
}
