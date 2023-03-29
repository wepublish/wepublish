import {Field, InputType, Int, ObjectType, registerEnumType} from '@nestjs/graphql'
import {UserEvent} from '@prisma/client'
import {MailTemplateRef} from '../subscription-flow/subscription-flow.model'

registerEnumType(UserEvent, {
  name: 'UserEvent'
})

@ObjectType()
export class SystemMailModel {
  @Field(() => UserEvent)
  event!: UserEvent

  @Field(() => MailTemplateRef)
  mailTemplate!: MailTemplateRef
}

@InputType()
export class SystemMailUpdateInput {
  @Field(() => UserEvent)
  event!: UserEvent

  @Field(() => Int)
  mailTemplateId!: number
}

@InputType()
export class SystemMailTestInput {
  @Field(() => UserEvent)
  event!: UserEvent
}
