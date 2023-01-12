"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripePaymentProvider = void 0;
const paymentProvider_1 = require("./paymentProvider");
const stripe_1 = __importDefault(require("stripe"));
const server_1 = require("../server");
const client_1 = require("@prisma/client");
function mapStripeEventToPaymentStatue(event) {
    switch (event) {
        case 'requires_payment_method':
        case 'requires_confirmation':
        case 'requires_action':
            return client_1.PaymentState.requiresUserAction;
        case 'processing':
            return client_1.PaymentState.processing;
        case 'succeeded':
            return client_1.PaymentState.paid;
        case 'canceled':
            return client_1.PaymentState.canceled;
        default:
            return null;
    }
}
class StripePaymentProvider extends paymentProvider_1.BasePaymentProvider {
    constructor(props) {
        super(props);
        this.stripe = new stripe_1.default(props.secretKey, {
            apiVersion: '2020-08-27'
        });
        this.webhookEndpointSecret = props.webhookEndpointSecret;
    }
    async createStripeCustomer({ intent }) {
        var _a;
        const customer = await this.stripe.customers.create({
            email: (_a = intent.metadata.mail) !== null && _a !== void 0 ? _a : '',
            payment_method: intent.payment_method,
            invoice_settings: {
                default_payment_method: intent.payment_method
            }
        });
        return customer.id;
    }
    getWebhookEvent(body, signature) {
        return this.stripe.webhooks.constructEvent(body, signature, this.webhookEndpointSecret);
    }
    async webhookForPaymentIntent(props) {
        const signature = props.req.headers['stripe-signature'];
        const event = this.getWebhookEvent(props.req.body, signature);
        if (!event.type.startsWith('payment_intent')) {
            throw new Error(`Can not handle ${event.type}`);
        }
        const intent = event.data.object;
        const intentStates = [];
        const state = mapStripeEventToPaymentStatue(intent.status);
        if (state !== null && intent.metadata.paymentID !== undefined) {
            let customerID;
            if (intent.setup_future_usage === 'off_session' &&
                intent.customer === null &&
                intent.payment_method !== null) {
                customerID = await this.createStripeCustomer({ intent });
            }
            else {
                customerID = intent.customer;
            }
            intentStates.push({
                paymentID: intent.metadata.paymentID,
                paymentData: JSON.stringify(intent),
                state,
                customerID
            });
        }
        return intentStates;
    }
    async createIntent({ customerID, invoice, saveCustomer, paymentID }) {
        var _a;
        let paymentMethodID = null;
        if (customerID) {
            // For an off_session payment the default_payment_method or the default_source of the customer will be used.
            // If both are available the default_payment_method will be used.
            // If no user, deleted user, no default_payment_method or no default_source the intent will be created without an customer.
            const customer = await this.stripe.customers.retrieve(customerID);
            if (customer.deleted) {
                (0, server_1.logger)('stripePaymentProvider').warn('Provided customerID "%s" returns a deleted stripe customer', customerID);
            }
            else if (customer.invoice_settings.default_payment_method !== null) {
                paymentMethodID = customer.invoice_settings.default_payment_method;
            }
            else if (customer.default_source !== null) {
                paymentMethodID = customer.default_source;
            }
            else {
                (0, server_1.logger)('stripePaymentProvider').warn('Provided customerID "%s" has no default_payment_method or default_source', customerID);
            }
        }
        let intent;
        let errorCode;
        try {
            intent = await this.stripe.paymentIntents.create(Object.assign(Object.assign(Object.assign(Object.assign({ amount: invoice.items.reduce((prevItem, currentItem) => prevItem + currentItem.amount * currentItem.quantity, 0) }, (customerID && paymentMethodID
                ? {
                    confirm: true,
                    customer: customerID,
                    off_session: true,
                    payment_method: paymentMethodID,
                    payment_method_types: ['card']
                }
                : {})), { currency: 'chf' }), (saveCustomer ? { setup_future_usage: 'off_session' } : {})), { metadata: {
                    paymentID: paymentID,
                    mail: invoice.mail
                } }));
        }
        catch (err) {
            const error = err;
            (0, server_1.logger)('stripePaymentProvider').error(error, 'Error while creating Stripe Intent for paymentProvider %s', this.id);
            if (error.type === 'StripeCardError') {
                intent = error.raw.payment_intent;
                errorCode = error.raw.code;
            }
            else {
                intent = {
                    id: 'unknown_error',
                    error,
                    state: client_1.PaymentState.requiresUserAction
                };
                errorCode = 'unknown_error';
            }
        }
        const state = mapStripeEventToPaymentStatue(intent.status);
        (0, server_1.logger)('stripePaymentProvider').info('Created Stripe intent with ID: %s for paymentProvider %s', intent.id, this.id);
        return {
            intentID: intent.id,
            intentSecret: (_a = intent.client_secret) !== null && _a !== void 0 ? _a : '',
            intentData: JSON.stringify(intent),
            state: state !== null && state !== void 0 ? state : client_1.PaymentState.submitted,
            errorCode
        };
    }
    async checkIntentStatus({ intentID }) {
        const intent = await this.stripe.paymentIntents.retrieve(intentID);
        const state = mapStripeEventToPaymentStatue(intent.status);
        if (!state) {
            (0, server_1.logger)('stripePaymentProvider').error('Stripe intent with ID: %s for paymentProvider %s returned with an unknown state %s', intent.id, this.id, intent.status);
            throw new Error('unknown intent state');
        }
        if (!intent.metadata.paymentID) {
            (0, server_1.logger)('stripePaymentProvider').error('Stripe intent with ID: %s for paymentProvider %s returned with empty paymentID', intent.id, this.id);
            throw new Error('empty paymentID');
        }
        let customerID;
        if (intent.setup_future_usage === 'off_session' &&
            intent.customer === null &&
            intent.payment_method !== null) {
            customerID = await this.createStripeCustomer({ intent });
        }
        else {
            customerID = intent.customer;
        }
        return {
            state,
            paymentID: intent.metadata.paymentID,
            paymentData: JSON.stringify(intent),
            customerID
        };
    }
}
exports.StripePaymentProvider = StripePaymentProvider;
//# sourceMappingURL=stripePaymentProvider.js.map