"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeCheckoutPaymentProvider = void 0;
const paymentProvider_1 = require("./paymentProvider");
const stripe_1 = __importDefault(require("stripe"));
const server_1 = require("../server");
const client_1 = require("@prisma/client");
function mapStripeCheckoutEventToPaymentStatue(event) {
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
class StripeCheckoutPaymentProvider extends paymentProvider_1.BasePaymentProvider {
    constructor(props) {
        super(props);
        this.stripe = new stripe_1.default(props.secretKey, {
            apiVersion: '2020-08-27'
        });
        this.webhookEndpointSecret = props.webhookEndpointSecret;
    }
    getWebhookEvent(body, signature) {
        return this.stripe.webhooks.constructEvent(body, signature, this.webhookEndpointSecret);
    }
    async webhookForPaymentIntent(props) {
        const signature = props.req.headers['stripe-signature'];
        const event = this.getWebhookEvent(props.req.body, signature);
        if (!event.type.startsWith('checkout.session'))
            throw new Error(`Can not handle ${event.type}`);
        const session = event.data.object;
        const intentStates = [];
        switch (event.type) {
            case 'checkout.session.completed': {
                const intent = await this.stripe.paymentIntents.retrieve(session.payment_intent);
                const state = mapStripeCheckoutEventToPaymentStatue(intent.status);
                if (state !== null && session.client_reference_id !== null) {
                    intentStates.push({
                        paymentID: session.client_reference_id,
                        paymentData: JSON.stringify(intent),
                        state
                    });
                }
            }
        }
        return intentStates;
    }
    async createIntent(props) {
        if (!props.successURL)
            throw new Error('SuccessURL is not defined');
        if (!props.failureURL)
            throw new Error('FailureURL is not defined');
        const session = await this.stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: props.invoice.items.map(item => ({
                price_data: {
                    currency: 'chf',
                    product_data: {
                        name: item.name
                    },
                    unit_amount: item.amount
                },
                quantity: item.quantity
            })),
            mode: 'payment',
            success_url: props.successURL,
            cancel_url: props.failureURL,
            client_reference_id: props.paymentID,
            customer_email: props.invoice.mail
        });
        if (session.amount_total === null) {
            throw new Error('Error amount_total can not be null');
        }
        (0, server_1.logger)('stripeCheckoutPaymentProvider').info('Created Stripe checkout session with ID: %s for paymentProvider %s', session.id, this.id);
        if (session.url === null) {
            throw new Error('session url can not be null');
        }
        return {
            intentID: session.id,
            intentSecret: session.url,
            intentData: JSON.stringify(session),
            state: client_1.PaymentState.submitted
        };
    }
    async checkIntentStatus({ intentID }) {
        const session = await this.stripe.checkout.sessions.retrieve(intentID);
        const state = session.payment_status === 'paid' ? client_1.PaymentState.paid : client_1.PaymentState.requiresUserAction;
        if (!session.client_reference_id) {
            (0, server_1.logger)('stripePaymentProvider').error('Stripe checkout session with ID: %s for paymentProvider %s returned with client_reference_id', session.id, this.id);
            throw new Error('empty paymentID');
        }
        return {
            state,
            paymentID: session.client_reference_id,
            paymentData: JSON.stringify(session)
        };
    }
}
exports.StripeCheckoutPaymentProvider = StripeCheckoutPaymentProvider;
//# sourceMappingURL=stripeCheckoutPaymentProvider.js.map