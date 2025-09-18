import {
  ArgsType,
  Field,
  InputType,
  Int,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import { BannerAction, CreateBannerActionInput } from './banner-action.model';
import { Image } from '@wepublish/image/api';
import { LoginStatus } from '@prisma/client';

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

@InputType()
export class PageModelInput {
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

  @Field({ nullable: true })
  cta?: string;

  @Field({ nullable: true })
  html?: string;

  @Field()
  active!: boolean;

  @Field(() => Int)
  delay!: number;

  @Field()
  showOnArticles!: boolean;

  @Field({ nullable: true })
  imageId?: string;

  @Field(() => Image, { nullable: true })
  image?: Image;

  @Field(() => [PageModel], { nullable: true })
  showOnPages?: PageModel[];

  @Field(() => LoginStatus)
  showForLoginStatus!: LoginStatus;

  @Field(() => [BannerAction], { nullable: true })
  actions?: BannerAction[];
}

@InputType()
export class CreateBannerInput extends OmitType(
  Banner,
  ['id', 'image', 'actions', 'showOnPages'],
  InputType
) {
  @Field(() => [CreateBannerActionInput], { nullable: true })
  actions?: CreateBannerActionInput[];

  @Field(() => [PageModelInput], { nullable: true })
  showOnPages?: PageModelInput[];
}

@InputType()
export class UpdateBannerInput extends OmitType(
  Banner,
  ['image', 'actions', 'showOnPages'],
  InputType
) {
  @Field(() => [CreateBannerActionInput], { nullable: true })
  actions!: CreateBannerActionInput[];

  @Field(() => [PageModelInput], { nullable: true })
  showOnPages?: PageModelInput[];
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
}
