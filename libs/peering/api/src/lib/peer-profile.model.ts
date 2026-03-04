import {
  ArgsType,
  Field,
  ObjectType,
  OmitType,
  PickType,
} from '@nestjs/graphql';
import { Image, PeerImage } from '@wepublish/image/api';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { ColorScalar } from '@wepublish/utils/api';
import { Descendant } from 'slate';

@ObjectType()
export class PeerProfile {
  @Field()
  name!: string;

  @Field({ nullable: true })
  logoID?: string;

  @Field(() => Image, { nullable: true })
  logo?: Image;

  @Field({ nullable: true })
  squareLogoId?: string;

  @Field(() => Image, { nullable: true })
  squareLogo?: Image;

  @Field(() => ColorScalar)
  themeColor!: string;

  @Field(() => ColorScalar)
  themeFontColor!: string;

  @Field()
  hostURL!: string;

  @Field()
  websiteURL!: string;

  @Field(() => GraphQLRichText)
  callToActionText!: Descendant[];

  @Field()
  callToActionURL!: string;

  @Field({ nullable: true })
  callToActionImageURL?: string;

  @Field({ nullable: true })
  callToActionImageID?: string;

  @Field(() => Image, { nullable: true })
  callToActionImage?: Image;
}

@ArgsType()
export class UpsertPeerProfileInput extends PickType(
  PeerProfile,
  [
    'name',
    'themeColor',
    'themeFontColor',
    'callToActionImageURL',
    'callToActionText',
    'callToActionURL',
  ] as const,
  ArgsType
) {
  @Field()
  logoID!: string;
  @Field()
  squareLogoId!: string;
  @Field()
  callToActionImageID!: string;
}

@ObjectType()
export class RemotePeerProfile extends OmitType(
  PeerProfile,
  ['callToActionImage', 'logo', 'squareLogo'] as const,
  ObjectType
) {
  @Field(() => PeerImage, { nullable: true })
  callToActionImage?: PeerImage;

  @Field(() => PeerImage, { nullable: true })
  logo?: PeerImage;

  @Field(() => PeerImage, { nullable: true })
  squareLogo?: PeerImage;
}
