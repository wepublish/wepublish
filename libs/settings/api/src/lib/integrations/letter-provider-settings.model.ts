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
import {
  LetterAddressPosition,
  LetterDeliveryProduct,
  LetterPrintMode,
  LetterPrintSpectrum,
  LetterProviderEnvironment,
  LetterProviderType,
} from '@prisma/client';
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

  // How letters nobody chose print options for are printed, i.e. automated
  // subscription mails for users in letter mode. The enums are registered by
  // the membership lib, which shares this schema.
  @Field(() => LetterAddressPosition, { nullable: true })
  defaultAddressPosition?: LetterAddressPosition | null;

  @Field(() => LetterDeliveryProduct, { nullable: true })
  defaultDeliveryProduct?: LetterDeliveryProduct | null;

  @Field(() => LetterPrintMode, { nullable: true })
  defaultPrintMode?: LetterPrintMode | null;

  @Field(() => LetterPrintSpectrum, { nullable: true })
  defaultPrintSpectrum?: LetterPrintSpectrum | null;
}

@InputType()
export class SettingLetterProviderFilter extends PartialType(
  PickType(SettingLetterProvider, ['id', 'type', 'name'] as const, InputType),
  InputType
) {}

@ArgsType()
export class CreateSettingLetterProviderInput extends OmitType(
  SettingLetterProvider,
  [
    'id',
    'type',
    'environment',
    'autoSend',
    'createdAt',
    'lastLoadedAt',
    'modifiedAt',
  ] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => LetterProviderType)
  type!: LetterProviderType;

  @Field(type => LetterProviderEnvironment, { nullable: true })
  environment?: LetterProviderEnvironment;

  @Field({ nullable: true })
  autoSend?: boolean;

  @Field({ nullable: true })
  clientSecret?: string;

  @Field({ nullable: true })
  webhookSigningKey?: string;
}

@ArgsType()
export class UpdateSettingLetterProviderInput extends PartialType(
  CreateSettingLetterProviderInput,
  ArgsType
) {}
