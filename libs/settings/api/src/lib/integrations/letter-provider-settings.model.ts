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
import { LetterProviderEnvironment, LetterProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(LetterProviderType, {
  name: 'LetterProviderType',
});

registerEnumType(LetterProviderEnvironment, {
  name: 'LetterProviderEnvironment',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingLetterProvider extends SettingProvider {
  @Field(type => LetterProviderType)
  type!: LetterProviderType;

  @Field(type => LetterProviderEnvironment)
  environment!: LetterProviderEnvironment;

  @Field({ nullable: true })
  clientId?: string;

  /** hide sensitive fields
  @Field({ nullable: true })
  clientSecret?: string;

  @Field({ nullable: true })
  webhookSigningKey?: string;
 **/

  @Field({ nullable: true })
  organisationId?: string;

  @Field()
  autoSend!: boolean;

  @Field({
    nullable: true,
    description:
      'Email addresses containing this are placeholders, not real inboxes (e.g. @placeholder.example.com).',
  })
  placeholderEmailContains?: string;
}

@InputType()
export class SettingLetterProviderFilter extends PartialType(
  PickType(SettingLetterProvider, ['id', 'type', 'name'] as const, InputType),
  InputType
) {}

@ArgsType()
export class CreateSettingLetterProviderInput extends OmitType(
  SettingLetterProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => LetterProviderType)
  type!: LetterProviderType;

  @Field({ nullable: true })
  clientSecret?: string;

  @Field({ nullable: true })
  webhookSigningKey?: string;
}

@ArgsType()
export class UpdateSettingLetterProviderInput extends PartialType(
  OmitType(CreateSettingLetterProviderInput, ['type'] as const, ArgsType),
  ArgsType
) {}
