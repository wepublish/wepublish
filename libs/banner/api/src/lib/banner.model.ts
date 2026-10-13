import {
  ArgsType,
  Field,
  Int,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { LoginStatus } from '@prisma/client';
import { BannerDocumentType, PageModel } from '@wepublish/gate/api';
import { Image } from '@wepublish/image/api';
import { BannerAction } from './banner-action.model';

export { BannerDocumentType };

registerEnumType(BannerDocumentType, {
  name: 'BannerDocumentType',
});

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
