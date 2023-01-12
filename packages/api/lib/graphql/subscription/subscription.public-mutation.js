"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePublicSubscription = void 0;
const error_1 = require("../../error");
const updatePublicSubscription = async (id, input, authenticateUser, memberContext, activeMemberPlansByID, activePaymentMethodsByID, subscriptionClient) => {
    var _a;
    const { user } = authenticateUser();
    const subscription = await subscriptionClient.findUnique({
        where: { id },
        include: {
            deactivation: true
        }
    });
    if (!subscription)
        throw new error_1.NotFound('subscription', id);
    const { memberPlanID, paymentPeriodicity, monthlyAmount, autoRenew, paymentMethodID } = input;
    const memberPlan = await activeMemberPlansByID.load(memberPlanID);
    if (!memberPlan)
        throw new error_1.NotFound('MemberPlan', memberPlanID);
    const paymentMethod = await activePaymentMethodsByID.load(paymentMethodID);
    if (!paymentMethod)
        throw new error_1.NotFound('PaymentMethod', paymentMethodID);
    if (!monthlyAmount || monthlyAmount < memberPlan.amountPerMonthMin)
        throw new error_1.MonthlyAmountNotEnough();
    if (!memberPlan.availablePaymentMethods.some(apm => {
        if (apm.forceAutoRenewal && !autoRenew) {
            return false;
        }
        return (apm.paymentPeriodicities.includes(paymentPeriodicity) &&
            apm.paymentMethodIDs.includes(paymentMethodID));
    })) {
        throw new error_1.PaymentConfigurationNotAllowed();
    }
    const updateSubscription = await subscriptionClient.update({
        where: { id },
        data: {
            userID: (_a = subscription.userID) !== null && _a !== void 0 ? _a : user.id,
            memberPlanID,
            paymentPeriodicity,
            monthlyAmount,
            autoRenew,
            paymentMethodID,
            deactivation: {
                delete: Boolean(subscription.deactivation)
            }
        },
        include: {
            deactivation: true,
            periods: true,
            properties: true
        }
    });
    if (!updateSubscription)
        throw new Error('Error during updateSubscription');
    // cancel open invoices if subscription is deactivated
    if (input.deactivation !== null) {
        await memberContext.cancelInvoicesForSubscription(id);
    }
    return await memberContext.handleSubscriptionChange({
        subscription: updateSubscription
    });
};
exports.updatePublicSubscription = updatePublicSubscription;
//# sourceMappingURL=subscription.public-mutation.js.map