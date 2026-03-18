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

  @Field({ nullable: true })
  lastSyncAt?: Date;

  @Field({ nullable: true })
  lastSyncError?: string;
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
  ] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => SyncProviderType)
  type!: SyncProviderType;

  @Field({ nullable: true })
  mailchimp_apiKey?: string;
}

@ArgsType()
export class UpdateSettingSyncProviderInput extends PartialType(
  OmitType(CreateSettingSyncProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {
  @Field()
  id!: string;
}
