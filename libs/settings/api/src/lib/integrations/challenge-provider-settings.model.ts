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
import { ChallengeProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

// Register the enum for GraphQL
registerEnumType(ChallengeProviderType, {
  name: 'ChallengeProviderType',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingChallengeProvider extends SettingProvider {
  @Field(type => ChallengeProviderType)
  type!: ChallengeProviderType;
  /** hide sensitive filds
  @Field(type => String, { nullable: true })
  secret?: string;

  @Field(type => String, { nullable: true })
  siteKey?: string;
    **/
}

@InputType()
export class SettingChallengeProviderFilter extends PartialType(
  PickType(
    SettingChallengeProvider,
    ['id', 'type', 'name'] as const,
    InputType
  ),
  InputType
) {}

@ArgsType()
export class CreateSettingChallengeProviderInput extends OmitType(
  SettingChallengeProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(type => String)
  id!: string;

  @Field(type => ChallengeProviderType)
  type!: ChallengeProviderType;

  @Field(type => String, { nullable: true })
  secret?: string;

  @Field(type => String, { nullable: true })
  siteKey?: string;
}

@ArgsType()
export class UpdateSettingChallengeProviderInput extends PartialType(
  OmitType(CreateSettingChallengeProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {
  @Field(type => String)
  id!: string;
}
