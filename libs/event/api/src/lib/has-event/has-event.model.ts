import {Field, ID, InterfaceType} from '@nestjs/graphql'
import {Event} from '../event.model'

@InterfaceType()
export abstract class HasEvent {
  @Field(() => ID, {nullable: true})
  eventID?: string

  @Field(() => Event, {nullable: true})
  event?: Event
}
