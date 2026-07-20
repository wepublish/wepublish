import {
  Field,
  Int,
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

@ObjectType()
export class MailchimpMapping {
  @Field()
  memberPlanId!: string;

  @Field(() => [String])
  activeFieldIds!: string[];

  @Field(() => [String])
  retargetFieldIds!: string[];

  @Field(() => Int)
  retargetDelayDays!: number;

  @Field(() => [String])
  interestGroupIds!: string[];
}

@InputType()
export class MailchimpMappingInput {
  @Field()
  memberPlanId!: string;

  @Field(() => [String], { nullable: true })
  activeFieldIds?: string[];

  @Field(() => [String], { nullable: true })
  retargetFieldIds?: string[];

  @Field(() => Int, { nullable: true })
  retargetDelayDays?: number;

  @Field(() => [String], { nullable: true })
  interestGroupIds?: string[];
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

  @Field(() => [String], { nullable: true })
  mailchimp_defaultInterestGroupIds?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  mailchimp_extensions?: Record<string, any>;

  @Field(() => [String], { nullable: true })
  firstnameFields?: string[];

  @Field(() => [String], { nullable: true })
  lastnameFields?: string[];

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

  @Field(() => [MailchimpMappingInput], { nullable: true })
  mailchimpMappings?: MailchimpMappingInput[];
}

@ArgsType()
export class UpdateSettingSyncProviderInput extends PartialType(
  OmitType(CreateSettingSyncProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {
  @Field()
  override id!: string;
}
