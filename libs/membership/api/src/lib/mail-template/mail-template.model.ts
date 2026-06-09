import {
  Field,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
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

  @Field({
    nullable: true,
    description: 'Provider type (e.g. MAILCHIMP, MAILGUN, SLACK)',
  })
  type?: string;
}

@ObjectType()
export class MailTemplateContentModel {
  @Field()
  html!: string;

  @Field({ nullable: true })
  subject?: string;
}

@ObjectType()
export class MailPlaceholderModel {
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

@InputType()
export class MailTemplateCreateInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  html!: string;

  @Field({ nullable: true })
  subject?: string;
}

@InputType()
export class MailTemplateUpdateInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  html!: string;

  @Field({ nullable: true })
  subject?: string;
}
