import {Field, Int, ObjectType} from '@nestjs/graphql'

@ObjectType()
export class MailTemplateWithUrlAndStatusModel {
  @Field(() => Int)
  id!: number

  @Field()
  name!: string

  @Field({nullable: true})
  description?: string

  @Field()
  externalMailTemplateId!: string

  @Field()
  remoteMissing!: boolean

  @Field()
  url!: string

  @Field()
  status!: string
}

@ObjectType()
export class MailProviderModel {
  @Field()
  name!: string
}
