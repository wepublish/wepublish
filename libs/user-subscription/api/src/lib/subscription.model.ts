import {
  ArgsType,
  Field,
  Float,
  InputType,
  ObjectType,
  OmitType,
  registerEnumType,
} from '@nestjs/graphql';
import type { PaymentPeriodicity as PaymentPeriodicityType } from '@prisma/client';
import { PaymentPeriodicity } from '@prisma/client';
import { PropertyInput } from '@wepublish/property/api';
import { GraphQLSlug } from '@wepublish/utils/api';

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity',
});

export enum FirstPrintIssueChoice {
  current = 'current',
  upcoming = 'upcoming',
}

registerEnumType(FirstPrintIssueChoice, {
  name: 'FirstPrintIssueChoice',
  description:
    'current: the issue shipped last is the first one. upcoming: the next one is.',
});

@InputType({
  description:
    'Which printed issue the subscription starts with («Abo-Start»), as the reader chose it from printIssueStart.',
})
export class FirstPrintIssueInput {
  @Field({ description: 'The id of the current issue the reader was shown.' })
  currentIssueId!: string;

  @Field(() => FirstPrintIssueChoice)
  choice!: FirstPrintIssueChoice;
}

@InputType()
export class UpdateUserSubscriptionInput {
  @Field()
  id!: string;

  @Field()
  memberPlanID!: string;

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity: PaymentPeriodicityType;

  @Field(() => Float)
  monthlyAmount: number;

  @Field()
  autoRenew: boolean;

  @Field()
  paymentMethodID: string;
}

@ObjectType()
export class CreateSubscriptionInfo {
  @Field(() => Float, { nullable: true })
  discountPercent?: number;

  @Field({ nullable: true })
  discountCodeValid?: boolean;
}

@ArgsType()
export class CreateSubscriptionArgs {
  @Field({ nullable: true })
  discountCode?: string;

  @Field({ nullable: true })
  memberPlanID?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  memberPlanSlug?: string;

  @Field()
  autoRenew!: boolean;

  @Field(() => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity;

  @Field(() => Float)
  monthlyAmount!: number;

  @Field({ nullable: true })
  paymentMethodID?: string;

  @Field(() => GraphQLSlug, { nullable: true })
  paymentMethodSlug?: string;

  @Field(() => [PropertyInput], { nullable: true })
  subscriptionProperties?: PropertyInput[];

  @Field({ nullable: true })
  goodieId?: string;

  @Field(() => FirstPrintIssueInput, { nullable: true })
  firstPrintIssue?: FirstPrintIssueInput;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;

  @Field({ nullable: true })
  deactivateSubscriptionId?: string;
}

@ArgsType()
export class CreateSubscriptionWithConfirmationArgs extends OmitType(
  CreateSubscriptionArgs,
  ['successURL', 'failureURL', 'deactivateSubscriptionId'],
  ArgsType
) {
  @Field({ nullable: true })
  userId?: string;
}

@ArgsType()
export class ExtendSubscriptionArgs {
  @Field()
  subscriptionId!: string;

  @Field({ nullable: true })
  successURL?: string;

  @Field({ nullable: true })
  failureURL?: string;
}
