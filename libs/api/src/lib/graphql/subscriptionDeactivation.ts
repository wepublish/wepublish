import { SubscriptionDeactivationReason } from '@prisma/client';
import { GraphQLEnumType, GraphQLNonNull, GraphQLObjectType } from 'graphql';
import { GraphQLDateTime } from 'graphql-scalars';

export const GraphQLSubscriptionDeactivationReason = new GraphQLEnumType({
  name: 'SubscriptionDeactivationReason',
  values: {
    [SubscriptionDeactivationReason.none]: {
      value: SubscriptionDeactivationReason.none,
    },
    [SubscriptionDeactivationReason.userSelfDeactivated]: {
      value: SubscriptionDeactivationReason.userSelfDeactivated,
    },
    [SubscriptionDeactivationReason.invoiceNotPaid]: {
      value: SubscriptionDeactivationReason.invoiceNotPaid,
    },
    [SubscriptionDeactivationReason.userReplacedSubscription]: {
      value: SubscriptionDeactivationReason.userReplacedSubscription,
    },
  },
});

export const GraphQLSubscriptionDeactivation = new GraphQLObjectType({
  name: 'SubscriptionDeactivation',
  fields: {
    date: { type: new GraphQLNonNull(GraphQLDateTime) },
    reason: { type: new GraphQLNonNull(GraphQLSubscriptionDeactivationReason) },
  },
});
