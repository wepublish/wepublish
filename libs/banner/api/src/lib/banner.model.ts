import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { BannerAction } from './banner-action.model';
import { Image } from '@wepublish/image/api';

/**
 * Banners are announcement engagement rules now. This keeps `primaryBanner`
 * and its types for websites that still ask for it.
 */
export enum LoginStatus {
  PAYWALL_BYPASSED = 'PAYWALL_BYPASSED',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  SUBSCRIBED = 'SUBSCRIBED',
  LOGGED_IN = 'LOGGED_IN',
  LOGGED_OUT = 'LOGGED_OUT',
  ALL = 'ALL',
}

registerEnumType(LoginStatus, {
  name: 'LoginStatus',
});

/*
This is only here to provide the interface for the "showOnPages" field
and can be removed when Pages are moved to APIv2
*/
@ObjectType()
export class PageModel {
  @Field()
  id!: string;
}

@ObjectType()
export class Banner {
  @Field()
  id!: string;

  @Field()
  title!: string;

  @Field()
  text!: string;

  @Field(() => String, { nullable: true })
  cta?: string | null;

  @Field(() => String, { nullable: true })
  html?: string | null;

  @Field(() => String, { nullable: true })
  embedUrl?: string | null;

  @Field()
  active!: boolean;

  @Field()
  collapsible!: boolean;

  @Field(() => Int)
  delay!: number;

  @Field(() => Int)
  hideForMinutes!: number;

  @Field()
  showOnArticles!: boolean;

  @Field(() => String, { nullable: true })
  imageId?: string | null;

  @Field(() => Image, { nullable: true })
  image?: Image;

  @Field(() => [PageModel], { nullable: true })
  showOnPages?: PageModel[];

  @Field(() => LoginStatus)
  showForLoginStatus!: LoginStatus;

  @Field(() => [BannerAction], { nullable: true })
  actions?: BannerAction[];
}

export enum BannerDocumentType {
  PAGE,
  ARTICLE,
}

registerEnumType(BannerDocumentType, {
  name: 'BannerDocumentType',
});

@ArgsType()
export class PrimaryBannerArgs {
  @Field(() => BannerDocumentType)
  documentType!: BannerDocumentType;

  @Field()
  documentId!: string;

  @Field()
  loggedIn!: boolean;

  @Field()
  hasSubscription!: boolean;

  @Field()
  hasPaywallBypass!: boolean;
}
