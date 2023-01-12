"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAdminSubscription = exports.createSubscription = exports.deleteSubscriptionById = void 0;
const permissions_1 = require("../permissions");
const user_1 = require("../../db/user");
const error_1 = require("../../error");
const deleteSubscriptionById = (id, authenticate, subscription) => {
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanDeleteSubscription, roles);
    return subscription.delete({
        where: {
            id
        },
        include: {
            deactivation: true,
            periods: true,
            properties: true
        }
    });
};
exports.deleteSubscriptionById = deleteSubscriptionById;
const createSubscription = async (_a, authenticate, memberContext, subscriptionClient) => {
    var { properties } = _a, input = __rest(_a, ["properties"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateSubscription, roles);
    const subscription = await subscriptionClient.create({
        data: Object.assign(Object.assign({}, input), { properties: {
                createMany: {
                    data: properties
                }
            } }),
        include: {
            deactivation: true,
            periods: true,
            properties: true
        }
    });
    await memberContext.renewSubscriptionForUser({ subscription });
    return subscription;
};
exports.createSubscription = createSubscription;
const updateAdminSubscription = async (id, _a, authenticate, memberContext, subscriptionClient, userClient) => {
    var { properties, deactivation } = _a, input = __rest(_a, ["properties", "deactivation"]);
    const { roles } = authenticate();
    (0, permissions_1.authorise)(permissions_1.CanCreateSubscription, roles);
    const user = await userClient.findUnique({
        where: {
            id: input.userID
        },
        select: user_1.unselectPassword
    });
    if (!user)
        throw new Error('Can not update subscription without user');
    const subscription = await subscriptionClient.findUnique({
        where: { id },
        include: {
            deactivation: true
        }
    });
    const updatedSubscription = await subscriptionClient.update({
        where: { id },
        data: Object.assign(Object.assign({}, input), { deactivation: deactivation
                ? {
                    upsert: {
                        create: deactivation,
                        update: deactivation
                    }
                }
                : {
                    delete: Boolean(subscription === null || subscription === void 0 ? void 0 : subscription.deactivation)
                }, properties: {
                deleteMany: {
                    subscriptionId: id
                },
                createMany: {
                    data: properties
                }
            } }),
        include: {
            deactivation: true,
            periods: true,
            properties: true
        }
    });
    if (!updatedSubscription)
        throw new error_1.NotFound('subscription', id);
    // cancel open invoices if subscription is deactivated
    if (deactivation !== null) {
        await memberContext.cancelInvoicesForSubscription(id);
    }
    return await memberContext.handleSubscriptionChange({
        subscription: updatedSubscription
    });
};
exports.updateAdminSubscription = updateAdminSubscription;
//# sourceMappingURL=subscription.private-mutation.js.map