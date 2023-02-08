import {Field, Int, ObjectType} from '@nestjs/graphql'
import {MailProvider, WithExternalId, WithUrl} from '@wepublish/api'

@ObjectType()
export class MailTemplateWithUrlModel {
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
}

@ObjectType()
export class MailProviderModel {
  @Field()
  name!: string
}

export function computeUrl<MailTemplate extends WithExternalId>(
  mailTemplate: MailTemplate,
  mailProvider: MailProvider
): WithUrl<MailTemplate> {
  return {
    ...mailTemplate,
    url: mailProvider.getTemplateUrl(mailTemplate)
  }
}
