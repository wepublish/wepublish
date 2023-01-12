"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrexxSubscriptionPaymentProvider = void 0;
const paymentProvider_1 = require("./paymentProvider");
const server_1 = require("../server");
const client_1 = require("@prisma/client");
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto = __importStar(require("crypto"));
const crypto_1 = require("crypto");
const qs_1 = __importDefault(require("qs"));
const sub_1 = __importDefault(require("date-fns/sub"));
const parseISO_1 = __importDefault(require("date-fns/parseISO"));
const startOfDay_1 = __importDefault(require("date-fns/startOfDay"));
const add_1 = __importDefault(require("date-fns/add"));
function mapPayrexxEventToPaymentStatus(event) {
    switch (event) {
        case 'waiting':
            return client_1.PaymentState.processing;
        case 'confirmed':
            return client_1.PaymentState.paid;
        case 'cancelled':
            return client_1.PaymentState.canceled;
        case 'declined':
            return client_1.PaymentState.declined;
        default:
            return null;
    }
}
function getMonths(pp) {
    switch (pp) {
        case client_1.PaymentPeriodicity.yearly:
            return 12;
        case client_1.PaymentPeriodicity.biannual:
            return 6;
        case client_1.PaymentPeriodicity.quarterly:
            return 3;
        case client_1.PaymentPeriodicity.monthly:
            return 1;
        default:
            return 1;
    }
}
function timeConstantCompare(a, b) {
    try {
        return (0, crypto_1.timingSafeEqual)(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
    }
    catch (_a) {
        return false;
    }
}
async function findSubscriptionByExternalId(subscriptionClient, externalId) {
    return subscriptionClient.findFirst({
        where: {
            properties: {
                some: {
                    key: 'payrexx_external_id',
                    value: `${externalId}`
                }
            }
        },
        include: {
            properties: true,
            deactivation: true,
            memberPlan: true,
            periods: {
                include: {
                    Invoice: true
                }
            }
        }
    });
}
async function deletePeriodOfUnpaidInvoice(subscriptionPeriodClient, subscription, invoice) {
    return subscriptionPeriodClient.deleteMany({
        where: {
            invoiceID: invoice.id
        }
    });
}
async function deleteUnpaidInvoices(invoiceClient, subscriptionPeriodClient, subscription) {
    const unpaidInvoices = await invoiceClient.findMany({
        where: {
            subscriptionID: subscription.id,
            paidAt: null
        }
    });
    for (const unpaidInvoice of unpaidInvoices) {
        await deletePeriodOfUnpaidInvoice(subscriptionPeriodClient, subscription, unpaidInvoice);
        await invoiceClient.delete({
            where: {
                id: unpaidInvoice.id
            }
        });
    }
}
class PayrexxSubscriptionPaymentProvider extends paymentProvider_1.BasePaymentProvider {
    constructor(props) {
        super(props);
        this.instanceName = props.instanceName;
        this.instanceAPISecret = props.instanceAPISecret;
        this.webhookSecret = props.webhookSecret;
        this.activateHook(props.prisma);
    }
    activateHook(prisma) {
        console.log('Activate Payrexx subscription prisma hook');
        const hook = () => async (params, next) => {
            var _a, _b, _c;
            // Only handle subscription update db queries skip all other
            if (params.model !== 'Subscription' ||
                params.action !== 'update' ||
                !params.args.data.paymentMethodID) {
                return next(params);
            }
            const subscription = params.args.data;
            // Get paymentProviderName
            const paymentProvider = await prisma.paymentMethod.findUnique({
                where: {
                    id: subscription.paymentMethodID
                }
            });
            // Exit if subscription has no external id or is other payment provider
            if (!subscription || (paymentProvider === null || paymentProvider === void 0 ? void 0 : paymentProvider.paymentProviderID) !== this.id) {
                return next(params);
            }
            // Find external id property and fail if subscription has been deactivated
            const properties = (_c = (_b = (_a = params.args.data) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.createMany) === null || _c === void 0 ? void 0 : _c.data;
            const isPayrexxExt = properties.find(sub => sub.key === 'payrexx_external_id');
            if (!isPayrexxExt) {
                throw Error("It's not supported to reactivate a deactivated Payrexx subscription!");
            }
            const deactivation = params.args.data.deactivation;
            // Disable Subscription (deactivation.upsert is defined if a deactivation is added)
            if (deactivation.upsert || !subscription.autoRenew) {
                await this.cancelRemoteSubscription(parseInt(isPayrexxExt.value, 10));
                // Rewrite properties
                isPayrexxExt.key = 'deactivated_payrexx_external_id';
                // Rewrite subscription
                subscription.autoRenew = false;
                subscription.deactivation = {
                    upsert: {
                        create: {
                            date: new Date(),
                            reason: client_1.SubscriptionDeactivationReason.userSelfDeactivated
                        },
                        update: {
                            date: new Date(),
                            reason: client_1.SubscriptionDeactivationReason.userSelfDeactivated
                        }
                    }
                };
                // Update subscription
            }
            else {
                const amount = subscription.monthlyAmount * getMonths(subscription.paymentPeriodicity);
                await this.updateRemoteSubscription(parseInt(isPayrexxExt.value, 10), amount.toString());
            }
            // Return in the end
            return next(params);
        };
        prisma.$use(hook());
    }
    async updatePaymentWithIntentState({ intentState, paymentClient, paymentsByID, invoicesByID, subscriptionClient, userClient, invoiceClient, subscriptionPeriodClient, invoiceItemClient }) {
        const apiData = JSON.parse(intentState.paymentData ? intentState.paymentData : '{}');
        const rawSubscription = apiData.subscription;
        const subscriptionId = rawSubscription.id;
        if (intentState.state === client_1.PaymentState.paid) {
            const subscriptionValidUntil = (0, startOfDay_1.default)((0, parseISO_1.default)(rawSubscription.valid_until));
            // Get subscription
            const subscription = await findSubscriptionByExternalId(subscriptionClient, subscriptionId);
            if (!subscription) {
                (0, server_1.logger)('payrexxSubscriptionPaymentProvider').warn(`Subscription ${subscriptionId} received from payrexx webhook not found!`);
                return;
            }
            // Calculate max possible Extension length for subscription security margin of 7 days
            const maxSubscriptionExtensionLength = (0, sub_1.default)(subscriptionValidUntil, { days: 7 });
            // Find last paid period in array
            let longestPeriod;
            for (const period of subscription.periods) {
                if (period.Invoice.paidAt && (!longestPeriod || period.endsAt > longestPeriod.endsAt)) {
                    longestPeriod = period;
                }
            }
            // If no period is found throw error
            if (!longestPeriod)
                throw Error(`No period found in subscription ${subscriptionId}`);
            // Skip if subscription is already renewed
            if (maxSubscriptionExtensionLength <= (0, startOfDay_1.default)(longestPeriod.endsAt)) {
                (0, server_1.logger)('payrexxSubscriptionPaymentProvider').warn(`Received webhook for subscription ${subscriptionId} which is already renewed: ${maxSubscriptionExtensionLength.toISOString()} <= ${(0, startOfDay_1.default)(longestPeriod.endsAt).toISOString()}`);
                return;
            }
            // Calculate new subscription valid until
            const newSubscriptionValidUntil = (0, add_1.default)(longestPeriod.endsAt, {
                months: getMonths(subscription.paymentPeriodicity)
            }).toISOString();
            const newSubscriptionValidFrom = (0, add_1.default)(longestPeriod.endsAt, {
                days: 1
            }).toISOString();
            // Get User
            const user = await userClient.findUnique({
                where: {
                    id: subscription.userID
                }
            });
            if (!user)
                throw Error('User in subscription not found!');
            // Get member plan
            const memberPlan = subscription.memberPlan;
            if (!memberPlan)
                throw Error('Member Plan in subscription not found!');
            const payedAmount = rawSubscription.invoice.amount;
            const minPayment = subscription.monthlyAmount * getMonths(subscription.paymentPeriodicity) - 100; // -1CHF to ensure that imported rounding differences are no issue
            if (payedAmount < minPayment) {
                (0, server_1.logger)('payrexxSubscriptionPaymentProvider').warn(`Payrexx Subscription ${subscription.id} payment ${payedAmount} lower than min payment ${minPayment}`);
                return;
            }
            // Delete unpaid
            await deleteUnpaidInvoices(invoiceClient, subscriptionPeriodClient, subscription);
            // Create invoice
            const invoice = await invoiceClient.create({
                data: {
                    mail: user.email,
                    dueAt: new Date(),
                    subscriptionID: subscription.id,
                    description: `Abo ${memberPlan.name}`,
                    paidAt: new Date(),
                    canceledAt: null,
                    sentReminderAt: new Date()
                }
            });
            await invoiceItemClient.create({
                data: {
                    invoiceId: invoice.id,
                    createdAt: new Date(),
                    modifiedAt: new Date(),
                    name: `Abo ${memberPlan.name}`,
                    quantity: 1,
                    amount: payedAmount
                }
            });
            if (!invoice)
                throw Error('Cant create Invoice');
            // Add subscription Period
            const subscriptionPeriod = await subscriptionPeriodClient.create({
                data: {
                    subscriptionId: subscription.id,
                    startsAt: newSubscriptionValidFrom,
                    endsAt: newSubscriptionValidUntil,
                    paymentPeriodicity: subscription.paymentPeriodicity,
                    amount: payedAmount,
                    invoiceID: invoice.id
                }
            });
            if (!subscriptionPeriod)
                throw Error('Cant create subscription period');
            // Create Payment
            const payment = await paymentClient.create({
                data: {
                    paymentMethodID: subscription.paymentMethodID,
                    state: client_1.PaymentState.paid,
                    invoiceID: invoice.id
                }
            });
            if (!payment)
                throw Error('Cant create Payment');
            // Update subscription
            await subscriptionClient.update({
                where: {
                    id: subscription.id
                },
                data: {
                    paidUntil: newSubscriptionValidUntil
                }
            });
            (0, server_1.logger)('payrexxSubscriptionPaymentProvider').info(`Subscription ${subscription.id} for user ${user.email} successfully renewed.`);
        }
        else {
            (0, server_1.logger)('payrexxSubscriptionPaymentProvider').info('External Auto renewal failed!');
        }
    }
    async updateRemoteSubscription(subscriptionId, amount) {
        const data = {
            amount,
            currency: 'CHF'
        };
        const signature = crypto
            .createHmac('sha256', this.instanceAPISecret)
            .update(qs_1.default.stringify(data))
            .digest('base64');
        const res = await (0, node_fetch_1.default)(`https://api.payrexx.com/v1.0/Subscription/${subscriptionId}/?instance=${encodeURIComponent(this.instanceName)}`, {
            method: 'PUT',
            body: qs_1.default.stringify(Object.assign(Object.assign({}, data), { ApiSignature: signature }))
        });
        if (res.status === 200) {
            (0, server_1.logger)('payrexxSubscriptionPaymentProvider').info('Payrexx response for subscription %s updated', subscriptionId);
        }
        else {
            (0, server_1.logger)('payrexxSubscriptionPaymentProvider').error('Payrexx subscription update response for subscription %s is NOK with status %s', subscriptionId, res.status);
            throw new Error(`Payrexx response is NOK with status ${res.status}`);
        }
    }
    async cancelRemoteSubscription(subscriptionId) {
        const signature = crypto.createHmac('sha256', this.instanceAPISecret).digest('base64');
        const res = await (0, node_fetch_1.default)(`https://api.payrexx.com/v1.0/Subscription/${subscriptionId}/?instance=${this.instanceName}`, {
            method: 'DELETE',
            body: qs_1.default.stringify({ ApiSignature: signature })
        });
        if (res.status === 200) {
            (0, server_1.logger)('payrexxSubscriptionPaymentProvider').info('Payrexx response for subscription %s canceled', subscriptionId);
        }
        else {
            (0, server_1.logger)('payrexxSubscriptionPaymentProvider').error('Payrexx subscription cancel response for subscription %s is NOK with status %s', subscriptionId, res.status);
            throw new Error(`Payrexx response is NOK with status ${res.status}`);
        }
    }
    async webhookForPaymentIntent(props) {
        const intentStates = [];
        // Protect endpoint
        const apiKey = props.req.query.apiKey;
        if (!timeConstantCompare(apiKey, this.webhookSecret))
            throw new Error('Invalid api key!');
        const transaction = props.req.body.transaction;
        if (!transaction)
            throw new Error('Can not handle webhook');
        const state = mapPayrexxEventToPaymentStatus(transaction.status);
        if (state !== null && transaction.subscription) {
            intentStates.push({
                paymentID: transaction.referenceId,
                paymentData: JSON.stringify(transaction),
                state
            });
        }
        return intentStates;
    }
    async createIntent(props) {
        throw new Error('NOT IMPLEMENTED');
    }
    async checkIntentStatus({ intentID }) {
        throw new Error('NOT IMPLEMENTED');
    }
}
exports.PayrexxSubscriptionPaymentProvider = PayrexxSubscriptionPaymentProvider;
//# sourceMappingURL=payrexxSubscriptionPaymentProvider.js.map