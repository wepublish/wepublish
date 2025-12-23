import {
  ArgsType,
  Field,
  ObjectType,
  OmitType,
  PartialType,
  Int,
} from '@nestjs/graphql';
import { MemberPlan } from '@wepublish/member-plan/api';
import { GraphQLRichText } from '@wepublish/richtext/api';
import { Descendant } from 'slate';

@ObjectType()
export class PaywallBypass {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field()
  token!: string;

  @Field()
  paywallId!: string;
}

@ObjectType()
export class Paywall {
  @Field()
  id!: string;

  @Field(() => Date)
  createdAt!: Date;

  @Field(() => Date)
  modifiedAt!: Date;

  @Field({ nullable: true })
  name?: string;

  @Field(() => GraphQLRichText, { nullable: true })
  description?: Descendant[];
  @Field(() => GraphQLRichText, { nullable: true })
  circumventDescription?: Descendant[];

  @Field(() => GraphQLRichText, { nullable: true })
  upgradeDescription?: Descendant[];
  @Field(() => GraphQLRichText, { nullable: true })
  upgradeCircumventDescription?: Descendant[];

  @Field({ nullable: true })
  alternativeSubscribeUrl?: string;

  @Field()
  anyMemberPlan!: boolean;

  @Field()
  active!: boolean;

  @Field(() => Int)
  hideContentAfter!: number;
  @Field()
  fadeout!: boolean;

  @Field(() => [MemberPlan])
  memberPlans!: MemberPlan[];

  @Field(() => [PaywallBypass])
  bypasses!: PaywallBypass[];
}

@ArgsType()
export class CreatePaywallInput extends OmitType(
  Paywall,
  ['id', 'memberPlans', 'bypasses', 'createdAt', 'modifiedAt'] as const,
  ArgsType
) {
  @Field(() => [String])
  memberPlanIds!: string[];

  @Field(() => [String])
  bypassTokens!: string[];
}

@ArgsType()
export class UpdatePaywallInput extends PartialType(
  CreatePaywallInput,
  ArgsType
) {
  @Field()
  id!: string;
}
