import {
  ObjectType,
  ArgsType,
  Field,
  OmitType,
  InputType,
} from '@nestjs/graphql';

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
  @Field(() => KeyEnabled)
  mailchimp!: KeyEnabled;
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

@ObjectType()
export class WebsiteSettings {
  @Field(() => WebsiteAnalytics)
  analytics!: WebsiteAnalytics;

  @Field(() => WebsiteMail)
  mail!: WebsiteMail;

  @Field(() => WebsiteAds)
  ads!: WebsiteAds;
}

@ArgsType()
export class UpdateWebsiteSettingsInput {
  @Field(() => WebsiteAnalyticsInput, { nullable: true })
  analytics?: WebsiteAnalyticsInput;
  @Field(() => WebsiteMailInput, { nullable: true })
  mail?: WebsiteMailInput;
  @Field(() => WebsiteAdsInput, { nullable: true })
  ads?: WebsiteAdsInput;
}
