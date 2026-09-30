import {
  ArgsType,
  Field,
  ObjectType,
  PartialType,
  registerEnumType,
} from '@nestjs/graphql';
import { NewsletterListLockedDisplay } from '@prisma/client';
import { MemberPlan } from '@wepublish/member-plan/api';

registerEnumType(NewsletterListLockedDisplay, {
  name: 'NewsletterListLockedDisplay',
});

@ObjectType()
export class NewsletterList {
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

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field()
  active!: boolean;

  @Field()
  requiresSubscription!: boolean;

  @Field()
  anyMemberPlan!: boolean;

  @Field()
  autoSubscribe!: boolean;

  @Field(() => NewsletterListLockedDisplay)
  lockedDisplay!: NewsletterListLockedDisplay;

  @Field(() => String, { nullable: true })
  lockedText?: string | null;

  @Field(() => String, { nullable: true })
  lockedLinkUrl?: string | null;

  @Field(() => [MemberPlan])
  memberPlans?: MemberPlan[];
}

@ArgsType()
export class CreateNewsletterListInput {
  @Field()
  name!: string;

  @Field()
  slug!: string;

  @Field(() => String, { nullable: true })
  description?: string | null;

  @Field({ nullable: true })
  active?: boolean;

  @Field({ nullable: true })
  requiresSubscription?: boolean;

  @Field({ nullable: true })
  anyMemberPlan?: boolean;

  @Field({ nullable: true })
  autoSubscribe?: boolean;

  @Field(() => NewsletterListLockedDisplay, { nullable: true })
  lockedDisplay?: NewsletterListLockedDisplay;

  @Field(() => String, { nullable: true })
  lockedText?: string | null;

  @Field(() => String, { nullable: true })
  lockedLinkUrl?: string | null;

  @Field(() => [String], { nullable: true })
  memberPlanIds?: string[];
}

@ArgsType()
export class UpdateNewsletterListInput extends PartialType(
  CreateNewsletterListInput,
  ArgsType
) {
  @Field()
  id!: string;
}
