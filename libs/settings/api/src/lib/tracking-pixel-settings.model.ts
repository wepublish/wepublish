import {
  Field,
  ObjectType,
  InputType,
  ArgsType,
  registerEnumType,
} from '@nestjs/graphql';
import { TrackingPixelProviderType } from '@prisma/client';

registerEnumType(TrackingPixelProviderType, {
  name: 'TrackingPixelProviderType',
});

@ObjectType()
export class SettingTrackingPixel {
  @Field(type => String)
  id!: string;

  @Field(type => Date)
  createdAt!: Date;

  @Field(type => Date)
  modifiedAt!: Date;

  @Field(type => TrackingPixelProviderType)
  type!: TrackingPixelProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  prolitteris_memberNr?: string;

  @Field(type => String, { nullable: true })
  prolitteris_username?: string;

  /** hide sensitive filds
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
export class SettingTrackingPixelFilter {
  @Field(type => String, { nullable: true })
  id?: string;

  @Field(type => TrackingPixelProviderType, { nullable: true })
  type?: TrackingPixelProviderType;

  @Field(type => String, { nullable: true })
  name?: string;
}

@InputType()
export class CreateSettingTrackingPixelInput {
  @Field(type => String)
  id!: string;

  @Field(type => TrackingPixelProviderType)
  type!: TrackingPixelProviderType;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  prolitteris_memberNr?: string;

  @Field(type => String, { nullable: true })
  prolitteris_username?: string;

  @Field(type => String, { nullable: true })
  prolitteris_password?: string;

  @Field(type => String, { nullable: true })
  prolitteris_publisherInternalKeyDomain?: string;

  @Field(type => Boolean, { nullable: true })
  prolitteris_usePublisherInternalKey?: boolean;

  @Field(type => Boolean, { nullable: true })
  prolitteris_onlyPaidContentAccess?: boolean;
}

@ArgsType()
export class UpdateSettingTrackingPixelInput {
  @Field(type => String)
  id!: string;

  @Field(type => String, { nullable: true })
  name?: string;

  @Field(type => String, { nullable: true })
  prolitteris_memberNr?: string;

  @Field(type => String, { nullable: true })
  prolitteris_username?: string;

  @Field(type => String, { nullable: true })
  prolitteris_password?: string;

  @Field(type => String, { nullable: true })
  prolitteris_publisherInternalKeyDomain?: string;

  @Field(type => Boolean, { nullable: true })
  prolitteris_usePublisherInternalKey?: boolean;

  @Field(type => Boolean, { nullable: true })
  prolitteris_onlyPaidContentAccess?: boolean;
}
