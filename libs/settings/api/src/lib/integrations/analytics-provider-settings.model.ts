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
  @Field(type => String, { nullable: true })
  credentials?: string;
  **/

  @Field(type => String, { nullable: true })
  property?: string;

  @Field(type => String, { nullable: true })
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

@ArgsType()
export class CreateSettingAnalyticsProviderInput extends OmitType(
  SettingAnalyticsProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(type => String)
  id!: string;

  @Field(type => AnalyticsProviderType)
  type!: AnalyticsProviderType;

  @Field(type => String, { nullable: true })
  credentials?: string;
}

@ArgsType()
export class UpdateSettingAnalyticsProviderInput extends PartialType(
  OmitType(CreateSettingAnalyticsProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {}
