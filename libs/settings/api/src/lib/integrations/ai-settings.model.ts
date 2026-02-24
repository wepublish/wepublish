import {
  Field,
  ObjectType,
  ArgsType,
  registerEnumType,
  PickType,
  PartialType,
  OmitType,
  InputType,
} from '@nestjs/graphql';
import { AIProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(AIProviderType, {
  name: 'AIProviderType',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingAIProvider extends SettingProvider {
  @Field(type => AIProviderType)
  type!: AIProviderType;

  /** hide sensitive fields
  @Field({ nullable: true })
  apiKey?: string;
   **/

  @Field({ nullable: true })
  systemPrompt?: string;
}

@InputType()
export class SettingAIProviderFilter extends PartialType(
  PickType(SettingAIProvider, ['id', 'type', 'name'] as const, InputType),
  InputType
) {}

@ArgsType()
export class CreateSettingAIProviderInput extends OmitType(
  SettingAIProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => AIProviderType)
  type!: AIProviderType;

  @Field({ nullable: true })
  apiKey?: string;
}

@ArgsType()
export class UpdateSettingAIProviderInput extends PartialType(
  OmitType(CreateSettingAIProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {}
