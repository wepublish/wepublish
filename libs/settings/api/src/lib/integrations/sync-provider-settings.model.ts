import {
  Field,
  ObjectType,
  ArgsType,
  PartialType,
  PickType,
  OmitType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { SyncProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';
import { GraphQLJSONObject } from 'graphql-type-json';

registerEnumType(SyncProviderType, {
  name: 'SyncProviderType',
});

@InputType()
export class SettingSyncProviderNewsletterInput {
  @Field()
  interestId!: string;

  @Field()
  name!: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  imageID?: string;
}

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingSyncProvider extends SettingProvider {
  @Field(type => SyncProviderType)
  type!: SyncProviderType;

  @Field({ nullable: true })
  enabled?: boolean;

  // Mailchimp-specific fields
  @Field({ nullable: true })
  mailchimp_listId?: string;

  @Field(() => [GraphQLJSONObject], { nullable: true })
  mailchimp_mergeFieldMappings?: Record<string, string>[];

  @Field(() => [GraphQLJSONObject], { nullable: true })
  mailchimp_interestGroupMappings?: Record<string, string>[];

  @Field(() => [String], { nullable: true })
  mailchimp_defaultInterestGroupIds?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  mailchimp_extensions?: Record<string, any>;

  @Field({
    nullable: true,
    description:
      'Whether logged-in readers see the newsletters in their profile and can subscribe to them there.',
  })
  newslettersInProfile?: boolean;

  @Field({ nullable: true })
  lastSyncAt?: Date;

  @Field({ nullable: true })
  lastSyncError?: string;

  @Field(() => String, {
    nullable: true,
    description: 'Id of the audience webhook the api registered at Mailchimp.',
  })
  mailchimp_webhookId?: string | null;

  @Field(() => Date, { nullable: true })
  mailchimp_webhookRegisteredAt?: Date | null;

  @Field(() => Date, {
    nullable: true,
    description: 'When the audience webhook last delivered a verified call.',
  })
  lastWebhookAt?: Date | null;
}

@InputType()
export class SettingSyncProviderFilter extends PartialType(
  PickType(
    SettingSyncProvider,
    ['id', 'name', 'enabled', 'type'] as const,
    InputType
  ),
  InputType
) {}

@ArgsType()
export class CreateSettingSyncProviderInput extends OmitType(
  SettingSyncProvider,
  [
    'id',
    'type',
    'createdAt',
    'lastLoadedAt',
    'modifiedAt',
    'lastSyncAt',
    'lastSyncError',
    'mailchimp_webhookId',
    'mailchimp_webhookRegisteredAt',
    'lastWebhookAt',
  ] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => SyncProviderType)
  type!: SyncProviderType;

  @Field({ nullable: true })
  mailchimp_apiKey?: string;

  @Field(() => [SettingSyncProviderNewsletterInput], { nullable: true })
  newsletters?: SettingSyncProviderNewsletterInput[];
}

@ArgsType()
export class UpdateSettingSyncProviderInput extends PartialType(
  OmitType(CreateSettingSyncProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {
  @Field()
  override id!: string;
}
