"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLMemberPlanInput = exports.GraphQLAvailablePaymentMethodInput = exports.GraphQLPublicMemberPlanConnection = exports.GraphQLMemberPlanConnection = exports.GraphQLMemberPlanSort = exports.GraphQLMemberPlanFilter = exports.GraphQLPublicMemberPlan = exports.GraphQLMemberPlan = exports.GraphQLPublicAvailablePaymentMethod = exports.GraphQLAvailablePaymentMethod = exports.GraphQLPaymentPeriodicity = void 0;
const memberPlan_1 = require("../db/memberPlan");
const richText_1 = require("./richText");
const image_1 = require("./image");
const utility_1 = require("../utility");
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const common_1 = require("./common");
const paymentMethod_1 = require("./paymentMethod");
const client_1 = require("@prisma/client");
exports.GraphQLPaymentPeriodicity = new graphql_1.GraphQLEnumType({
    name: 'PaymentPeriodicity',
    values: {
        MONTHLY: { value: client_1.PaymentPeriodicity.monthly },
        QUARTERLY: { value: client_1.PaymentPeriodicity.quarterly },
        BIANNUAL: { value: client_1.PaymentPeriodicity.biannual },
        YEARLY: { value: client_1.PaymentPeriodicity.yearly }
    }
});
exports.GraphQLAvailablePaymentMethod = new graphql_1.GraphQLObjectType({
    name: 'AvailablePaymentMethod',
    fields: {
        paymentMethods: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPaymentMethod))),
            async resolve({ paymentMethodIDs }, args, { prisma: { paymentMethod } }) {
                const paymentMethods = await paymentMethod.findMany({
                    where: {
                        id: {
                            in: paymentMethodIDs
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                return paymentMethods;
            }
        },
        paymentPeriodicities: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentPeriodicity)))
        },
        forceAutoRenewal: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLPublicAvailablePaymentMethod = new graphql_1.GraphQLObjectType({
    name: 'AvailablePaymentMethod',
    fields: {
        paymentMethods: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPublicPaymentMethod))),
            async resolve({ paymentMethodIDs }, args, { prisma: { paymentMethod } }) {
                const paymentMethods = await paymentMethod.findMany({
                    where: {
                        id: {
                            in: paymentMethodIDs
                        },
                        active: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                return paymentMethods;
            }
        },
        paymentPeriodicities: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentPeriodicity)))
        },
        forceAutoRenewal: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLMemberPlan = new graphql_1.GraphQLObjectType({
    name: 'MemberPlan',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, args, { loaders }) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        },
        description: { type: richText_1.GraphQLRichText },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) },
        active: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        amountPerMonthMin: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        availablePaymentMethods: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLAvailablePaymentMethod)))
        }
    }
});
exports.GraphQLPublicMemberPlan = new graphql_1.GraphQLObjectType({
    name: 'MemberPlan',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ imageID }, args, { loaders }) => {
                return imageID ? loaders.images.load(imageID) : null;
            })
        },
        description: { type: richText_1.GraphQLRichText },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) },
        amountPerMonthMin: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        availablePaymentMethods: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicAvailablePaymentMethod)))
        }
    }
});
exports.GraphQLMemberPlanFilter = new graphql_1.GraphQLInputObjectType({
    name: 'MemberPlanFilter',
    fields: {
        name: { type: graphql_1.GraphQLString },
        active: { type: graphql_1.GraphQLBoolean },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLMemberPlanSort = new graphql_1.GraphQLEnumType({
    name: 'MemberPlanSort',
    values: {
        CREATED_AT: { value: memberPlan_1.MemberPlanSort.CreatedAt },
        MODIFIED_AT: { value: memberPlan_1.MemberPlanSort.ModifiedAt }
    }
});
exports.GraphQLMemberPlanConnection = new graphql_1.GraphQLObjectType({
    name: 'MemberPlanConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLMemberPlan))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLPublicMemberPlanConnection = new graphql_1.GraphQLObjectType({
    name: 'MemberPlanConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicMemberPlan))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLAvailablePaymentMethodInput = new graphql_1.GraphQLInputObjectType({
    name: 'AvailablePaymentMethodInput',
    fields: {
        paymentMethodIDs: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString))) },
        paymentPeriodicities: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentPeriodicity)))
        },
        forceAutoRenewal: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) }
    }
});
exports.GraphQLMemberPlanInput = new graphql_1.GraphQLInputObjectType({
    name: 'MemberPlanInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        slug: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        imageID: { type: graphql_1.GraphQLID },
        description: { type: richText_1.GraphQLRichText },
        tags: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) },
        active: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        amountPerMonthMin: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        availablePaymentMethods: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLAvailablePaymentMethodInput)))
        }
    }
});
//# sourceMappingURL=memberPlan.js.map