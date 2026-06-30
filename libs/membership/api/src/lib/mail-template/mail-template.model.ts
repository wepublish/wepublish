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
export class MailTemplateModel {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field({ nullable: true })
  textContent?: string;

  @Field()
  status!: string;
}

@ObjectType()
export class MailProviderModel {
  @Field()
  name!: string;
}

@InputType()
export class MailTemplateInput {
  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field()
  subject!: string;

  @Field()
  htmlContent!: string;

  @Field({ nullable: true })
  textContent?: string;
}
