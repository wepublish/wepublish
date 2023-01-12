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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupPaymentProvider = exports.BasePaymentProvider = exports.PAYMENT_WEBHOOK_PATH_PREFIX = void 0;
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const express_1 = require("express");
const context_1 = require("../context");
const server_1 = require("../server");
exports.PAYMENT_WEBHOOK_PATH_PREFIX = 'payment-webhooks';
class BasePaymentProvider {
    constructor(props) {
        var _a;
        this.id = props.id;
        this.name = props.name;
        this.offSessionPayments = props.offSessionPayments;
        this.incomingRequestHandler = (_a = props.incomingRequestHandler) !== null && _a !== void 0 ? _a : body_parser_1.default.json();
    }
    async updatePaymentWithIntentState({ intentState, paymentClient, paymentsByID, invoicesByID, subscriptionClient, userClient }) {
        const payment = await paymentsByID.load(intentState.paymentID);
        // TODO: should we overwrite already paid/canceled payments
        if (!payment)
            throw new Error(`Payment with ID ${intentState.paymentID} not found`);
        const updatedPayment = await paymentClient.update({
            where: { id: payment.id },
            data: {
                state: intentState.state,
                paymentData: intentState.paymentData,
                intentData: payment.intentData,
                intentSecret: payment.intentSecret,
                intentID: payment.intentID,
                invoiceID: payment.invoiceID,
                paymentMethodID: payment.paymentMethodID
            }
        });
        if (!updatedPayment) {
            throw new Error('Error while updating Payment');
        }
        // get invoice and subscription joins out of the payment
        const invoice = await invoicesByID.load(payment.invoiceID);
        if (!invoice || !invoice.subscriptionID) {
            throw new Error(`Invoice with ID ${payment.invoiceID} does not exist`);
        }
        const subscription = await subscriptionClient.findUnique({
            where: {
                id: invoice.subscriptionID
            }
        });
        if (!subscription) {
            throw new Error(`Subscription with ID ${invoice.subscriptionID} does not exist`);
        }
        // update payment provider
        if (intentState.customerID && payment.invoiceID) {
            await this.updatePaymentProvider(userClient, subscription, intentState.customerID);
        }
        return updatedPayment;
    }
    /**
     * adding or updating paymentProvider customer ID for user
     *
     * @param userClient
     * @param subscription
     * @param customerID
     * @private
     */
    async updatePaymentProvider(userClient, subscription, customerID) {
        if (!subscription) {
            throw new Error('Empty subscription within updatePaymentProvider method.');
        }
        const user = await userClient.findUnique({
            where: {
                id: subscription.userID
            },
            include: {
                paymentProviderCustomers: true
            }
        });
        if (!user)
            throw new Error(`User with ID ${subscription.userID} does not exist`);
        await userClient.update({
            where: {
                id: user.id
            },
            data: {
                paymentProviderCustomers: {
                    deleteMany: {
                        paymentProviderID: this.id
                    },
                    create: {
                        paymentProviderID: this.id,
                        customerID
                    }
                }
            }
        });
    }
}
exports.BasePaymentProvider = BasePaymentProvider;
function setupPaymentProvider(opts) {
    const { paymentProviders, prisma } = opts;
    const paymentProviderWebhookRouter = (0, express_1.Router)();
    prisma.$use(async (params, next) => {
        if (params.model !== 'Payment') {
            return next(params);
        }
        if (params.action !== 'update') {
            return next(params);
        }
        const model = await next(params);
        if (model.state === client_1.PaymentState.paid) {
            const invoice = await prisma.invoice.findUnique({
                where: { id: model.invoiceID },
                include: {
                    items: true
                }
            });
            if (!invoice) {
                console.warn(`No invoice with id ${model.invoiceID}`);
                return;
            }
            const { items } = invoice, invoiceData = __rest(invoice, ["items"]);
            await prisma.invoice.update({
                where: { id: invoice.id },
                data: Object.assign(Object.assign({}, invoiceData), { items: {
                        deleteMany: {
                            invoiceId: invoiceData.id
                        },
                        create: items.map((_a) => {
                            var { invoiceId } = _a, item = __rest(_a, ["invoiceId"]);
                            return item;
                        })
                    }, paidAt: new Date(), canceledAt: null })
            });
        }
        return model;
    });
    // setup webhook routes for each payment provider
    paymentProviders.forEach(paymentProvider => {
        paymentProviderWebhookRouter
            .route(`/${paymentProvider.id}`)
            .all(paymentProvider.incomingRequestHandler, async (req, res, next) => {
            await res.status(200).send(); // respond immediately with 200 since webhook was received.
            (0, server_1.logger)('paymentProvider').info('Received webhook from %s for paymentProvider %s', req.get('origin'), paymentProvider.id);
            try {
                const paymentStatuses = await paymentProvider.webhookForPaymentIntent({ req });
                const context = await (0, context_1.contextFromRequest)(req, opts);
                for (const paymentStatus of paymentStatuses) {
                    // TODO: handle errors properly
                    await paymentProvider.updatePaymentWithIntentState({
                        intentState: paymentStatus,
                        paymentClient: context.prisma.payment,
                        paymentsByID: context.loaders.paymentsByID,
                        invoicesByID: context.loaders.invoicesByID,
                        subscriptionClient: context.prisma.subscription,
                        userClient: context.prisma.user,
                        invoiceClient: context.prisma.invoice,
                        subscriptionPeriodClient: context.prisma.subscriptionPeriod,
                        invoiceItemClient: context.prisma.invoiceItem
                    });
                }
            }
            catch (error) {
                (0, server_1.logger)('paymentProvider').error(error, 'Error during webhook update in paymentProvider %s', paymentProvider.id);
            }
        });
    });
    return paymentProviderWebhookRouter;
}
exports.setupPaymentProvider = setupPaymentProvider;
//# sourceMappingURL=paymentProvider.js.map