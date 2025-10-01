import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { MailTemplateStatus } from '@wepublish/mail/api';

registerEnumType(MailTemplateStatus, {
  name: 'MailTemplateStatus',
});

@ObjectType()
export class MailTemplateWithUrlAndStatusModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  externalMailTemplateId!: string;

  @Field()
  remoteMissing!: boolean;

  @Field()
  url!: string;

  @Field()
  status!: string;
}

@ObjectType()
export class MailProviderModel {
  @Field()
  name!: string;
}
