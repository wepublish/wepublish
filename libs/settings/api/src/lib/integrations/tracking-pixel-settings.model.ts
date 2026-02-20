import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  registerEnumType,
  PickType,
  PartialType,
  OmitType,
} from '@nestjs/graphql';
import { TrackingPixelProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(TrackingPixelProviderType, {
  name: 'TrackingPixelProviderType',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingTrackingPixel extends SettingProvider {
  @Field(type => TrackingPixelProviderType)
  type!: TrackingPixelProviderType;

  @Field(type => String, { nullable: true })
  prolitteris_memberNr?: string;

  @Field(type => String, { nullable: true })
  prolitteris_username?: string;

  /** hide sensitive fields
  @Field(type => String, { nullable: true })
  prolitteris_password?: string;
 **/

  @Field(type => String, { nullable: true })
  prolitteris_publisherInternalKeyDomain?: string;

  @Field(type => Boolean, { nullable: true })
  prolitteris_usePublisherInternalKey?: boolean;

  @Field(type => Boolean, { nullable: true })
  prolitteris_onlyPaidContentAccess?: boolean;
}

@InputType()
export class SettingTrackingPixelFilter extends PartialType(
  PickType(SettingTrackingPixel, ['id', 'type', 'name'] as const, InputType),
  InputType
) {}

@ArgsType()
export class CreateSettingTrackingPixelInput extends OmitType(
  SettingTrackingPixel,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(type => String)
  id!: string;

  @Field(type => TrackingPixelProviderType)
  type!: TrackingPixelProviderType;

  @Field(type => String, { nullable: true })
  prolitteris_password?: string;
}

@ArgsType()
export class UpdateSettingTrackingPixelInput extends PartialType(
  OmitType(CreateSettingTrackingPixelInput, ['type'] as const, ArgsType),
  ArgsType
) {}
