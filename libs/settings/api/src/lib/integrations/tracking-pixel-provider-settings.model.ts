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
export class SettingTrackingPixelProvider extends SettingProvider {
  @Field(type => TrackingPixelProviderType)
  type!: TrackingPixelProviderType;

  @Field({ nullable: true })
  prolitteris_memberNr?: string;

  @Field({ nullable: true })
  prolitteris_username?: string;

  /** hide sensitive fields
  @Field({ nullable: true })
  prolitteris_password?: string;
 **/

  @Field({ nullable: true })
  prolitteris_publisherInternalKeyDomain?: string;

  @Field(type => Boolean, { nullable: true })
  prolitteris_usePublisherInternalKey?: boolean;

  @Field(type => Boolean, { nullable: true })
  prolitteris_onlyPaidContentAccess?: boolean;
}

@InputType()
export class SettingTrackingPixelFilter extends PartialType(
  PickType(
    SettingTrackingPixelProvider,
    ['id', 'type', 'name'] as const,
    InputType
  ),
  InputType
) {}

@ArgsType()
export class CreateSettingTrackingPixelProviderInput extends OmitType(
  SettingTrackingPixelProvider,
  ['id', 'type', 'createdAt', 'lastLoadedAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field()
  id!: string;

  @Field(type => TrackingPixelProviderType)
  type!: TrackingPixelProviderType;

  @Field({ nullable: true })
  prolitteris_password?: string;
}

@ArgsType()
export class UpdateSettingTrackingPixelProviderInput extends PartialType(
  OmitType(
    CreateSettingTrackingPixelProviderInput,
    ['type'] as const,
    ArgsType
  ),
  ArgsType
) {}
