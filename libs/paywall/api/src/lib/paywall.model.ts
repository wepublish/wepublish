import { Field, ObjectType, Int } from '@nestjs/graphql';
import { MemberPlan } from '@wepublish/member-plan/api';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { GraphQLRichText } from '@wepublish/richtext/api';

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
  description?: RichtextJSONDocument[];
  @Field(() => GraphQLRichText, { nullable: true })
  circumventDescription?: RichtextJSONDocument;
  @Field(() => GraphQLRichText, { nullable: true })
  upgradeDescription?: RichtextJSONDocument[];
  @Field(() => GraphQLRichText, { nullable: true })
  upgradeCircumventDescription?: RichtextJSONDocument[];

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
