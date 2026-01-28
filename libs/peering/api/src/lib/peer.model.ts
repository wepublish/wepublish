import {
  ArgsType,
  Field,
  ObjectType,
  PartialType,
  PickType,
} from '@nestjs/graphql';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Descendant } from 'slate';
import { RemotePeerProfile } from './peer-profile.model';

@ObjectType()
export class Peer {
  @Field()
  id!: string;

  @Field()
  createdAt!: Date;

  @Field()
  modifiedAt!: Date;

  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => Boolean, { nullable: true })
  isDisabled?: boolean;

  @Field()
  hostURL!: string;

  @Field()
  token!: string;

  @Field(() => GraphQLRichText, { nullable: true })
  information?: Descendant[];

  @Field(() => RemotePeerProfile, { nullable: true })
  profile?: RemotePeerProfile;
}

@ArgsType()
export class CreatePeerInput extends PickType(
  Peer,
  ['slug', 'name', 'isDisabled', 'information', 'hostURL', 'token'] as const,
  ArgsType
) {}

@ArgsType()
export class UpdatePeerInput extends PartialType(CreatePeerInput, ArgsType) {
  @Field()
  id!: string;
}
