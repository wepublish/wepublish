import {
  Field,
  ObjectType,
  ArgsType,
  registerEnumType,
  PartialType,
  PickType,
  OmitType,
  InputType,
} from '@nestjs/graphql';
import { MailProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(MailProviderType, {
  name: 'MailProviderType',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingMailProvider extends SettingProvider {
  @Field(type => MailProviderType)
  type!: MailProviderType;

  @Field(type => String, { nullable: true })
  fromAddress?: string;

  @Field(type => String, { nullable: true })
  replyToAddress?: string;

  /** hide sensitive filds
  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

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
export class SettingMailProviderFilter extends PartialType(
  PickType(SettingMailProvider, ['id', 'type', 'name'] as const, InputType),
  InputType
) {}

@ArgsType()
export class CreateSettingMailProviderInput extends OmitType(
  SettingMailProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(type => String)
  id!: string;

  @Field(type => MailProviderType)
  type!: MailProviderType;

  @Field(type => String, { nullable: true })
  webhookEndpointSecret?: string;

  @Field(type => String, { nullable: true })
  apiKey?: string;
}

@ArgsType()
export class UpdateSettingMailProviderInput extends PartialType(
  OmitType(CreateSettingMailProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {
  @Field(type => String)
  id!: string;
}
