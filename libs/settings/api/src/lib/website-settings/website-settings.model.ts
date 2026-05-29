import {
  ObjectType,
  ArgsType,
  Field,
  OmitType,
  InputType,
  registerEnumType,
} from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { type Theme } from '@mui/material';

@ObjectType()
export class KeyEnabled {
  @Field()
  enabled!: boolean;
  @Field({ nullable: true })
  key?: string;
}

@InputType()
export class KeyEnabledInput extends OmitType(
  KeyEnabled,
  [] as const,
  InputType
) {}

@ObjectType()
export class WebsiteAnalytics {
  @Field(() => KeyEnabled)
  googleAnalytics!: KeyEnabled;
  @Field(() => KeyEnabled)
  googleTagManager!: KeyEnabled;
  @Field(() => KeyEnabled)
  plausible!: KeyEnabled;
}

@InputType()
export class WebsiteAnalyticsInput {
  @Field(() => KeyEnabledInput)
  googleAnalytics!: KeyEnabledInput;
  @Field(() => KeyEnabledInput)
  googleTagManager!: KeyEnabledInput;
  @Field(() => KeyEnabledInput)
  plausible!: KeyEnabledInput;
}

@ObjectType()
export class WebsiteMail {
  @Field(() => KeyEnabled, { nullable: true })
  mailchimp?: KeyEnabled;
}

@InputType()
export class WebsiteMailInput {
  @Field(() => KeyEnabledInput)
  mailchimp!: KeyEnabledInput;
}

@ObjectType()
export class WebsiteAds {
  @Field(() => KeyEnabled)
  sparkLoop!: KeyEnabled;
}

@InputType()
export class WebsiteAdsInput {
  @Field(() => KeyEnabledInput)
  sparkLoop!: KeyEnabledInput;
}

export enum FontWeight {
  Thin = 100,
  ExtraLight = 200,
  Light = 300,
  Regular = 400,
  Medium = 500,
  SemiBold = 600,
  Bold = 700,
  ExtraBold = 800,
  Black = 900,
  Variable = 'Variable',
}

registerEnumType(FontWeight, {
  name: 'FontWeight',
});

export enum FontStyle {
  normal = 'normal',
  italic = 'italic',
}

registerEnumType(FontStyle, {
  name: 'FontStyle',
});

@ObjectType()
export class WebsiteRemoteFont {
  @Field()
  name!: string;

  @Field(() => [FontWeight])
  weight!: FontWeight[];

  @Field(() => [FontStyle])
  style!: FontStyle[];
}

@InputType()
export class WebsiteRemoteFontInput extends OmitType(
  WebsiteRemoteFont,
  [] as const,
  InputType
) {}

@ObjectType()
export class WebsiteSettings {
  @Field(() => WebsiteAnalytics)
  analytics!: WebsiteAnalytics;

  @Field(() => WebsiteMail)
  mail!: WebsiteMail;

  @Field(() => WebsiteAds)
  ads!: WebsiteAds;

  @Field(() => GraphQLJSONObject)
  theme!: Theme;

  @Field(() => [WebsiteRemoteFont])
  fonts!: WebsiteRemoteFont[];
}

@ArgsType()
export class UpdateWebsiteSettingsInput {
  @Field(() => WebsiteAnalyticsInput, { nullable: true })
  analytics?: WebsiteAnalyticsInput;
  @Field(() => WebsiteMailInput, { nullable: true })
  mail?: WebsiteMailInput;
  @Field(() => WebsiteAdsInput, { nullable: true })
  ads?: WebsiteAdsInput;
  @Field(() => GraphQLJSONObject, { nullable: true })
  theme?: Theme;
  @Field(() => [WebsiteRemoteFontInput], { nullable: true })
  fonts?: WebsiteRemoteFontInput[];
}
