"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLMemberRegistrationAndPayment = exports.GraphQLMemberRegistration = exports.GraphQLUserSession = exports.GraphQLPaymentProviderCustomerInput = exports.GraphQLPublicUserInput = exports.GraphQLUserInput = exports.GraphQLUserAddressInput = exports.GraphQLUserConnection = exports.GraphQLUserSort = exports.GraphQLUserFilter = exports.GraphQLPublicUser = exports.GraphQLUser = exports.GraphQLOAuth2Account = exports.GraphQLPaymentProviderCustomer = exports.GraphQLUserAddress = void 0;
const graphql_1 = require("graphql");
const user_1 = require("../db/user");
const common_1 = require("./common");
const userRole_1 = require("./userRole");
const graphql_iso_date_1 = require("graphql-iso-date");
const payment_1 = require("./payment");
const memberPlan_1 = require("./memberPlan");
const subscriptionDeactivation_1 = require("./subscriptionDeactivation");
const subscriptionPeriods_1 = require("./subscriptionPeriods");
const invoice_1 = require("./invoice");
const utility_1 = require("../utility");
const image_1 = require("./image");
exports.GraphQLUserAddress = new graphql_1.GraphQLObjectType({
    name: 'UserAddress',
    fields: {
        company: { type: graphql_1.GraphQLString },
        streetAddress: { type: graphql_1.GraphQLString },
        streetAddress2: { type: graphql_1.GraphQLString },
        zipCode: { type: graphql_1.GraphQLString },
        city: { type: graphql_1.GraphQLString },
        country: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLPaymentProviderCustomer = new graphql_1.GraphQLObjectType({
    name: 'PaymentProviderCustomer',
    fields: {
        paymentProviderID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        customerID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLOAuth2Account = new graphql_1.GraphQLObjectType({
    name: 'OAuth2Account',
    fields: {
        type: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        provider: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        scope: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
const GraphQLUserSubscription = new graphql_1.GraphQLObjectType({
    name: 'UserSubscription',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        paymentPeriodicity: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLPaymentPeriodicity) },
        monthlyAmount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) },
        autoRenew: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        startsAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        paidUntil: { type: graphql_iso_date_1.GraphQLDateTime },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataProperty))) },
        deactivation: { type: subscriptionDeactivation_1.GraphQLSubscriptionDeactivation },
        periods: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(subscriptionPeriods_1.GraphQLSubscriptionPeriod)))
        },
        memberPlan: {
            type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLMemberPlan),
            resolve({ memberPlanID }, args, { prisma }) {
                return prisma.memberPlan.findUnique({
                    where: {
                        id: memberPlanID
                    }
                });
            }
        },
        invoices: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(invoice_1.GraphQLInvoice))),
            resolve({ id: subscriptionId }, args, { prisma }) {
                return prisma.invoice.findMany({
                    where: {
                        subscriptionID: subscriptionId
                    },
                    include: {
                        items: true
                    }
                });
            }
        }
    }
});
exports.GraphQLUser = new graphql_1.GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        modifiedAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        firstName: { type: graphql_1.GraphQLString },
        email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        emailVerifiedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        preferredName: { type: graphql_1.GraphQLString },
        address: { type: exports.GraphQLUserAddress },
        userImage: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ userImageID }, _, { prisma: { image } }) => userImageID
                ? image.findUnique({
                    where: {
                        id: userImageID
                    }
                })
                : null)
        },
        active: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        lastLogin: { type: graphql_iso_date_1.GraphQLDateTime },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataProperty))) },
        roles: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(userRole_1.GraphQLUserRole))),
            resolve({ roleIDs }, args, { loaders }) {
                return Promise.all(roleIDs.map(roleID => loaders.userRolesByID.load(roleID)));
            }
        },
        paymentProviderCustomers: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentProviderCustomer)))
        },
        oauth2Accounts: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLOAuth2Account)))
        },
        subscriptions: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(GraphQLUserSubscription))),
            resolve: (0, utility_1.createProxyingResolver)(({ id: userId }, _, { prisma }) => {
                return prisma.subscription.findMany({
                    where: {
                        userID: userId
                    },
                    include: {
                        deactivation: true,
                        periods: true,
                        properties: true
                    }
                });
            })
        }
    }
});
exports.GraphQLPublicUser = new graphql_1.GraphQLObjectType({
    name: 'User',
    fields: {
        id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        firstName: { type: graphql_1.GraphQLString },
        email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        preferredName: { type: graphql_1.GraphQLString },
        address: { type: exports.GraphQLUserAddress },
        paymentProviderCustomers: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLPaymentProviderCustomer)))
        },
        oauth2Accounts: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLOAuth2Account)))
        },
        image: {
            type: image_1.GraphQLImage,
            resolve: (0, utility_1.createProxyingResolver)(({ userImageID }, _, { prisma: { image } }) => userImageID
                ? image.findUnique({
                    where: {
                        id: userImageID
                    }
                })
                : null)
        }
    }
});
exports.GraphQLUserFilter = new graphql_1.GraphQLInputObjectType({
    name: 'UserFilter',
    fields: {
        name: { type: graphql_1.GraphQLString },
        text: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLUserSort = new graphql_1.GraphQLEnumType({
    name: 'UserSort',
    values: {
        CREATED_AT: { value: user_1.UserSort.CreatedAt },
        MODIFIED_AT: { value: user_1.UserSort.ModifiedAt },
        NAME: { value: user_1.UserSort.Name },
        FIRST_NAME: { value: user_1.UserSort.FirstName }
    }
});
exports.GraphQLUserConnection = new graphql_1.GraphQLObjectType({
    name: 'UserConnection',
    fields: {
        nodes: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(exports.GraphQLUser))) },
        pageInfo: { type: (0, graphql_1.GraphQLNonNull)(common_1.GraphQLPageInfo) },
        totalCount: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
    }
});
exports.GraphQLUserAddressInput = new graphql_1.GraphQLInputObjectType({
    name: 'UserAddressInput',
    fields: {
        company: { type: graphql_1.GraphQLString },
        streetAddress: { type: graphql_1.GraphQLString },
        streetAddress2: { type: graphql_1.GraphQLString },
        zipCode: { type: graphql_1.GraphQLString },
        city: { type: graphql_1.GraphQLString },
        country: { type: graphql_1.GraphQLString }
    }
});
exports.GraphQLUserInput = new graphql_1.GraphQLInputObjectType({
    name: 'UserInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        firstName: { type: graphql_1.GraphQLString },
        email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        emailVerifiedAt: { type: graphql_iso_date_1.GraphQLDateTime },
        preferredName: { type: graphql_1.GraphQLString },
        address: { type: exports.GraphQLUserAddressInput },
        userImageID: { type: graphql_1.GraphQLID },
        active: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean) },
        properties: { type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(common_1.GraphQLMetadataPropertyInput))) },
        roleIDs: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString)) }
    }
});
exports.GraphQLPublicUserInput = new graphql_1.GraphQLInputObjectType({
    name: 'UserInput',
    fields: {
        name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        firstName: { type: graphql_1.GraphQLString },
        email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        preferredName: { type: graphql_1.GraphQLString },
        address: { type: exports.GraphQLUserAddressInput },
        uploadImageInput: { type: image_1.GraphQLUploadImageInput }
    }
});
exports.GraphQLPaymentProviderCustomerInput = new graphql_1.GraphQLInputObjectType({
    name: 'PaymentProviderCustomerInput',
    fields: {
        paymentProviderID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        customerID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
    }
});
exports.GraphQLUserSession = new graphql_1.GraphQLObjectType({
    name: 'UserSession',
    fields: {
        token: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
        createdAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) },
        expiresAt: { type: (0, graphql_1.GraphQLNonNull)(graphql_iso_date_1.GraphQLDateTime) }
    }
});
exports.GraphQLMemberRegistration = new graphql_1.GraphQLObjectType({
    name: 'Registration',
    fields: {
        user: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicUser) },
        session: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLUserSession) }
    }
});
exports.GraphQLMemberRegistrationAndPayment = new graphql_1.GraphQLObjectType({
    name: 'RegistrationAndPayment',
    fields: {
        payment: { type: (0, graphql_1.GraphQLNonNull)(payment_1.GraphQLPublicPayment) },
        user: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLPublicUser) },
        session: { type: (0, graphql_1.GraphQLNonNull)(exports.GraphQLUserSession) }
    }
});
//# sourceMappingURL=user.js.map