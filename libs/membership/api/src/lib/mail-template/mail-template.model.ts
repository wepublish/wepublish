import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
import { MailProviderType } from '@prisma/client';
import { MailPlaceholder, MailTemplateStatus } from '@wepublish/mail/api';

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

  @Field(() => MailProviderType, { nullable: true })
  type?: MailProviderType;
}

@ObjectType()
export class MailPlaceholderModel implements MailPlaceholder {
  @Field()
  key!: string;

  @Field()
  example!: string;
}

@ObjectType()
export class MailPlaceholderGroupModel {
  @Field()
  event!: string;

  @Field(() => [MailPlaceholderModel])
  placeholders!: MailPlaceholderModel[];
}
