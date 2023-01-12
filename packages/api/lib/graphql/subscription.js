"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLSubscribersPerMonth = exports.GraphQLPublicSubscriptionInput = exports.GraphQLSubscriptionInput = exports.GraphQLSubscriptionDeactivationInput = exports.GraphQLSubscriptionConnection = exports.GraphQLSubscriptionSort = exports.GraphQLSubscriptionFilter = exports.GraphQLPublicSubscription = exports.GraphQLSubscription = void 0;
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const subscription_1 = require("../db/subscription");
const user_1 = require("../db/user");
const common_1 = require("./common");
const memberPlan_1 = require("./memberPlan");
const paymentMethod_1 = require("./paymentMethod");
const subscriptionDeactivation_1 = require("./subscriptionDeactivation");
const user_2 = require("./user");
exports.GraphQLSubscription = new graphql_1.GraphQLObjectType({
    name: 'Subscription',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        user: {
            type: user_2.GraphQLUser,
            async resolve({ userID }, args, { prisma }) {
                return prisma.user.findUnique({
                    where: {
                        id: userID
                    },
                    select: user_1.unselectPassword
                });
            }
        },
        memberPlan: {
            type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLMemberPlan),
            resolve({ memberPlanID }, args, { loaders }) {
                return loaders.memberPlansByID.load(memberPlanID);
            }
        },
        paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) },
        monthlyAmount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        autoRenew: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        startsAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        paidUntil: { type: graphql_iso_date_1.GraphQLDateTime },
        paymentMethod: {
            type: (0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPaymentMethod),
            resolve({ paymentMethodID }, args, { loaders }) {
                return loaders.paymentMethodsByID.load(paymentMethodID);
            }
        },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataProperty))) },
        deactivation: { type: subscriptionDeactivation_1.GraphQLSubscriptionDeactivation }
    }
});
exports.GraphQLPublicSubscription = new graphql_1.GraphQLObjectType({
    name: 'Subscription',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        memberPlan: {
            type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPublicMemberPlan),
            resolve({ memberPlanID }, args, { loaders }) {
                return loaders.memberPlansByID.load(memberPlanID);
            }
        },
        paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) },
        monthlyAmount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        autoRenew: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        startsAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        paidUntil: { type: graphql_iso_date_1.GraphQLDateTime },
        paymentMethod: {
            type: (0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPublicPaymentMethod),
            resolve({ paymentMethodID }, args, { loaders }) {
                return loaders.paymentMethodsByID.load(paymentMethodID);
            }
        },
        properties: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyPublic))),
            resolve: ({ properties }) => {
                return properties.filter(property => property.public).map(({ key, value }) => ({ key, value }));
            }
        },
        deactivation: { type: subscriptionDeactivation_1.GraphQLSubscriptionDeactivation }
    }
});
exports.GraphQLSubscriptionFilter = new graphql_1.GraphQLInputObjectType({
    name: 'SubscriptionFilter',
    fields: {
        startsAt: { type: common_1.GraphQLDateFilter },
        paidUntil: { type: common_1.GraphQLDateFilter },
        startsAtFrom: { type: common_1.GraphQLDateFilter },
        startsAtTo: { type: common_1.GraphQLDateFilter },
        paidUntilFrom: { type: common_1.GraphQLDateFilter },
        paidUntilTo: { type: common_1.GraphQLDateFilter },
        deactivationDateFrom: { type: common_1.GraphQLDateFilter },
        deactivationDateTo: { type: common_1.GraphQLDateFilter },
        deactivationReason: { type: subscriptionDeactivation_1.GraphQLSubscriptionDeactivationReason },
        autoRenew: { type: graphql_1.GraphQLBoolean },
        paymentMethodID: { type: graphql_1.GraphQLString },
        memberPlanID: { type: graphql_1.GraphQLString },
        paymentPeriodicity: { type: memberPlan_1.GraphQLPaymentPeriodicity },
        userHasAddress: { type: graphql_1.GraphQLBoolean },
        userID: { type: graphql_1.GraphQLID }
    }
});
exports.GraphQLSubscriptionSort = new graphql_1.GraphQLEnumType({
    name: 'SubscriptionSort',
    values: {
        CREATED_AT: { value: subscription_1.SubscriptionSort.CreatedAt },
        MODIFIED_AT: { value: subscription_1.SubscriptionSort.ModifiedAt }
    }
});
exports.GraphQLSubscriptionConnection = new graphql_1.GraphQLObjectType({
    name: 'SubscriptionConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLSubscription))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLSubscriptionDeactivationInput = new graphql_1.GraphQLInputObjectType({
    name: 'SubscriptionDeactivationInput',
    fields: {
        date: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        reason: { type: (0, graphql_1.GraphQLNonNull)(subscriptionDeactivation_1.GraphQLSubscriptionDeactivationReason) }
    }
});
exports.GraphQLSubscriptionInput = new graphql_1.GraphQLInputObjectType({
    name: 'SubscriptionInput',
    fields: {
        userID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        memberPlanID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) },
        monthlyAmount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        autoRenew: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        startsAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        paidUntil: { type: graphql_iso_date_1.GraphQLDateTime },
        paymentMethodID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        properties: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyInput)))
        },
        deactivation: { type: exports.GraphQLSubscriptionDeactivationInput }
    }
});
exports.GraphQLPublicSubscriptionInput = new graphql_1.GraphQLInputObjectType({
    name: 'SubscriptionInput',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        memberPlanID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) },
        monthlyAmount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        autoRenew: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        paymentMethodID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLSubscribersPerMonth = new graphql_1.GraphQLObjectType({
    name: 'SubscribersPerMonth',
    fields: {
        month: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        subscriberCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
//# sourceMappingURL=subscription.js.map