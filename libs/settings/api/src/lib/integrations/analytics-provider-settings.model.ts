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

import { AnalyticsProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(AnalyticsProviderType, { name: 'AnalyticsProviderType' });

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingAnalyticsProvider extends SettingProvider {
  @Field(type => AnalyticsProviderType)
  type!: AnalyticsProviderType;

  /** hide sensitive field
  @Field({ nullable: true })
  credentials?: string;
  **/

  @Field({ nullable: true })
  property?: string;

  @Field({ nullable: true })
  articlePrefix?: string;
}

@InputType()
export class SettingAnalyticsProviderFilter extends PartialType(
  PickType(
    SettingAnalyticsProvider,
    ['id', 'type', 'name'] as const,
    InputType
  ),
  InputType
) {}

@InputType()
export class SettingAnalyticsCredentialsInput {
  @Field()
  type!: string;

  @Field()
  project_id!: string;

  @Field()
  private_key_id!: string;

  @Field()
  private_key!: string;

  @Field()
  client_email!: string;

  @Field()
  client_id!: string;
}

@ArgsType()
export class CreateSettingAnalyticsProviderInput extends OmitType(
  SettingAnalyticsProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => AnalyticsProviderType)
  type!: AnalyticsProviderType;

  @Field(type => SettingAnalyticsCredentialsInput, { nullable: true })
  credentials?: SettingAnalyticsCredentialsInput;
}

@ArgsType()
export class UpdateSettingAnalyticsProviderInput extends PartialType(
  OmitType(CreateSettingAnalyticsProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {}
