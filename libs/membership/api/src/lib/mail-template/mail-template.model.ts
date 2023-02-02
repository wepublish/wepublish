import {Field, Int, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class MailTemplate {
  @Field(() => Int)
  id: number

  @Field()
  name: string

  @Field({nullable: true})
  description?: string

  @Field()
  externalMailTemplateId: string

  @Field()
  remoteMissing: boolean
}
