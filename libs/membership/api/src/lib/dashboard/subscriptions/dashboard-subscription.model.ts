import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import {
  PaymentPeriodicity,
  SubscriptionDeactivationReason,
} from '@prisma/client';

registerEnumType(SubscriptionDeactivationReason, {
  name: 'SubscriptionDeactivationReason',
});

registerEnumType(PaymentPeriodicity, {
  name: 'PaymentPeriodicity',
});

@ObjectType()
export class DashboardSubscription {
  @Field()
  startsAt!: Date;

  @Field({ nullable: true })
  endsAt?: Date;

  @Field({ nullable: true })
  deactivationDate?: Date;

  @Field({ nullable: true })
  renewsAt?: Date;

  @Field()
  memberPlan!: string;

  @Field(type => PaymentPeriodicity)
  paymentPeriodicity!: PaymentPeriodicity;

  @Field(type => Int)
  monthlyAmount!: number;

  @Field(type => SubscriptionDeactivationReason, { nullable: true })
  reasonForDeactivation?: SubscriptionDeactivationReason;
}

@ObjectType()
export class DailySubscriptionStatsUser {
  @Field()
  id!: string;

  @Field()
  name!: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field()
  email!: string;

  @Field({ nullable: true })
  subscriptionID?: string;
}

@ObjectType()
export class DailyPredictedSubscriptionRenewalCount {
  @Field(() => Int)
  high!: number;

  @Field(() => Int)
  low!: number;

  @Field(() => Int)
  total!: number;

  @Field(() => Int)
  perDayHighProbability!: number;

  @Field(() => Int)
  perDayLowProbability!: number;
}

@ObjectType()
export class DailySubscriptionStats {
  @Field()
  date!: string;

  @Field(() => Int)
  totalActiveSubscriptionCount!: number;

  @Field(() => Int)
  createdSubscriptionCount!: number;

  @Field(type => [DailySubscriptionStatsUser])
  createdSubscriptionUsers!: DailySubscriptionStatsUser[];

  @Field(() => Int)
  overdueSubscriptionCount!: number;

  @Field(type => [DailySubscriptionStatsUser])
  overdueSubscriptionUsers!: DailySubscriptionStatsUser[];

  @Field(() => Int)
  replacedSubscriptionCount!: number;

  @Field(type => [DailySubscriptionStatsUser])
  replacedSubscriptionUsers!: DailySubscriptionStatsUser[];

  @Field(() => Int)
  renewedSubscriptionCount!: number;

  @Field(type => [DailySubscriptionStatsUser])
  renewedSubscriptionUsers!: DailySubscriptionStatsUser[];

  @Field(() => Int)
  deactivatedSubscriptionCount!: number;

  @Field(type => [DailySubscriptionStatsUser])
  deactivatedSubscriptionUsers!: DailySubscriptionStatsUser[];

  @Field(() => Int)
  endingSubscriptionCount!: number;

  @Field(type => [DailySubscriptionStatsUser])
  endingSubscriptionUsers!: DailySubscriptionStatsUser[];

  @Field(() => DailyPredictedSubscriptionRenewalCount)
  predictedSubscriptionRenewalCount!: DailyPredictedSubscriptionRenewalCount;

  @Field(() => [DailySubscriptionStatsUser])
  predictedSubscriptionRenewalUsersHighProbability!: DailySubscriptionStatsUser[];

  @Field(() => [DailySubscriptionStatsUser])
  predictedSubscriptionRenewalUsersLowProbability!: DailySubscriptionStatsUser[];
}
