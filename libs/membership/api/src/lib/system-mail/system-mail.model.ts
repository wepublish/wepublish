import {Field, InputType, Int, ObjectType} from '@nestjs/graphql'
import {MailTemplateRef} from '../subscription-flow/subscription-flow.model'

@ObjectType()
export class SystemMailModel {
  @Field()
  event!: string

  @Field(() => MailTemplateRef)
  mailTemplate!: MailTemplateRef
}

@InputType()
export class SystemMailUpdateInput {
  @Field()
  event!: string
  @Field(() => Int)
  mailTemplateId!: number
}
