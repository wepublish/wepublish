import {
  MetadataProperty,
  PaymentPeriodicity,
  Subscription,
  SubscriptionDeactivation,
  SubscriptionDeactivationReason,
  SubscriptionPeriod,
} from '@prisma/client';
import { DateFilter } from '@wepublish/utils/api';

export enum SubscriptionSort {
  CreatedAt = 'createdAt',
  ModifiedAt = 'modifiedAt',
}

export interface SubscriptionFilter {
  readonly startsAtFrom?: DateFilter;
  readonly startsAtTo?: DateFilter;
  readonly paidUntilFrom?: DateFilter;
  readonly paidUntilTo?: DateFilter;
  readonly deactivationDateFrom?: DateFilter;
  readonly deactivationDateTo?: DateFilter;
  readonly cancellationDateFrom?: DateFilter;
  readonly cancellationDateTo?: DateFilter;
  readonly deactivationReason?: SubscriptionDeactivationReason;
  readonly autoRenew?: boolean;
  readonly paymentMethodID?: string;
  readonly memberPlanID?: string;
  readonly paymentPeriodicity?: PaymentPeriodicity;
  readonly userHasAddress?: boolean;
  readonly userID?: string;
  readonly userIDs?: string[];
  readonly subscriptionIDs?: string[];
  readonly extendable?: boolean;
}

export type SubscriptionWithRelations = Subscription & {
  periods: SubscriptionPeriod[];
  properties: MetadataProperty[];
  deactivation: SubscriptionDeactivation | null;
};

export type SubscribersPerMonth = {
  readonly month: string;
  readonly subscriberCount: number;
};
