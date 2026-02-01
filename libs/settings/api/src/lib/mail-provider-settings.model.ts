import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  registerEnumType,
} from '@nestjs/graphql';
import { MailProviderType } from '@prisma/client';

registerEnumType(MailProviderType, {
  name: 'MailProviderType',
});

@ObjectType()
export class SettingMailProvider {
  @Field(type => String)
  id!: string;

  @Field(type => Date)
  createdAt!: Date;

  @Field(type => Date)
  modifiedAt!: Date;

  @Field(type => Date)
  lastLoadedAt!: Date;

  @Field(type => MailProviderType)
  type!: MailProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  fromAddress?: string;

  @Field(type => String, { nullable: true })
  replyToAddress?: string;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

  /** hide sensitive filds
  @Field(type => String, { nullable: true })
  apiKey?: string;
 **/

  @Field(type => String, { nullable: true })
  mailgun_mailDomain?: string;

  @Field(type => String, { nullable: true })
  mailgun_baseDomain?: string;

  @Field(type => String, { nullable: true })
  mailchimp_baseURL?: string;

  @Field(type => String, { nullable: true })
  slack_webhookURL?: string;
}

@InputType()
export class SettingMailProviderFilter {
  @Field(type => String, { nullable: true })
  id?: string;

  @Field(type => MailProviderType, { nullable: true })
  type?: MailProviderType;

  @Field(type => String, { nullable: true })
  name?: string;
}

@InputType()
export class CreateSettingMailProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => MailProviderType)
  type!: MailProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  fromAddress?: string;

  @Field(type => String, { nullable: true })
  replyToAddress?: string;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;

  @Field(type => String, { nullable: true })
  mailgun_mailDomain?: string;

  @Field(type => String, { nullable: true })
  mailgun_baseDomain?: string;

  @Field(type => String, { nullable: true })
  mailchimp_baseURL?: string;

  @Field(type => String, { nullable: true })
  slack_webhookURL?: string;
}

@ArgsType()
export class UpdateSettingMailProviderInput {
  @Field(type => String)
  id!: string;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  fromAddress?: string;

  @Field(type => String, { nullable: true })
  replyToAddress?: string;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;

  @Field(type => String, { nullable: true })
  mailgun_mailDomain?: string;

  @Field(type => String, { nullable: true })
  mailgun_baseDomain?: string;

  @Field(type => String, { nullable: true })
  mailchimp_baseURL?: string;

  @Field(type => String, { nullable: true })
  slack_webhookURL?: string;
}
