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

import { FrontendTrackingProviderType } from '@prisma/client';
import { SettingProvider } from './integration.model';

registerEnumType(FrontendTrackingProviderType, {
  name: 'FrontendTrackingProviderType',
});

@ObjectType({
  implements: () => [SettingProvider],
})
export class SettingFrontendTracking extends SettingProvider {
  @Field(type => FrontendTrackingProviderType)
  type!: FrontendTrackingProviderType;

  @Field()
  active!: boolean;

  @Field({ nullable: true })
  ga4_measurementId?: string;

  @Field({ nullable: true })
  gtm_containerId?: string;

  @Field({ nullable: true })
  plausible_siteId?: string;

  @Field({ nullable: true })
  plausible_scriptUrl?: string;

  @Field({ nullable: true })
  piwik_containerId?: string;

  @Field({ nullable: true })
  piwik_subdomain?: string;
}

@InputType()
export class SettingFrontendTrackingFilter extends PartialType(
  PickType(
    SettingFrontendTracking,
    ['id', 'type', 'name', 'active'] as const,
    InputType
  ),
  InputType
) {}

@ArgsType()
export class UpdateSettingFrontendTrackingInput extends PartialType(
  OmitType(
    SettingFrontendTracking,
    ['createdAt', 'modifiedAt', 'lastLoadedAt', 'type'] as const,
    ArgsType
  ),
  ArgsType
) {
  @Field()
  id!: string;
}
