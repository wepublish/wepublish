"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayrexxPaymentProvider = void 0;
const paymentProvider_1 = require("./paymentProvider");
const node_fetch_1 = __importDefault(require("node-fetch"));
const crypto_1 = __importDefault(require("crypto"));
const qs_1 = __importDefault(require("qs"));
const server_1 = require("../server");
const client_1 = require("@prisma/client");
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
class PayrexxPaymentProvider extends paymentProvider_1.BasePaymentProvider {
    constructor(props) {
        super(props);
        this.instanceName = props.instanceName;
        this.instanceAPISecret = props.instanceAPISecret;
        this.psp = props.psp;
        this.pm = props.pm;
        this.vatRate = props.vatRate;
    }
    async webhookForPaymentIntent(props) {
        // TODO: verify webhook
        const intentStates = [];
        const transaction = props.req.body.transaction;
        if (!transaction)
            throw new Error('Can not handle webhook');
        const state = mapPayrexxEventToPaymentStatus(transaction.status);
        if (state !== null) {
            intentStates.push({
                paymentID: transaction.referenceId,
                paymentData: JSON.stringify(transaction),
                state
            });
        }
        return intentStates;
    }
    async createIntent(props) {
        var _a, _b, _c;
        const data = {
            psp: this.psp,
            pm: this.pm,
            referenceId: props.paymentID,
            amount: props.invoice.items.reduce((prevItem, currentItem) => prevItem + currentItem.amount * currentItem.quantity, 0),
            fields: {
                email: {
                    value: props.invoice.mail
                }
            },
            successRedirectUrl: props.successURL,
            failedRedirectUrl: props.failureURL,
            cancelRedirectUrl: props.failureURL,
            vatRate: this.vatRate,
            currency: 'CHF'
        };
        const signature = crypto_1.default
            .createHmac('sha256', this.instanceAPISecret)
            .update(qs_1.default.stringify(data))
            .digest('base64');
        const res = await (0, node_fetch_1.default)(`https://api.payrexx.com/v1.0/Gateway/?instance=${encodeURIComponent(this.instanceName)}`, {
            method: 'POST',
            body: qs_1.default.stringify(Object.assign(Object.assign({}, data), { ApiSignature: signature }))
        });
        if (res.status !== 200)
            throw new Error(`Payrexx response is NOK with status ${res.status}`);
        const payrexxResponse = (await res.json());
        (0, server_1.logger)('payrexxPaymentProvider').info('Created Payrexx intent with ID: %s for paymentProvider %s', (_a = payrexxResponse.data) === null || _a === void 0 ? void 0 : _a[0].id, this.id);
        // in case Payrexx throws an error
        if (payrexxResponse.status === 'error') {
            throw new Error(`Error from Payrexx: ${payrexxResponse.message}`);
        }
        return {
            intentID: (_b = payrexxResponse.data) === null || _b === void 0 ? void 0 : _b[0].id,
            intentSecret: (_c = payrexxResponse.data) === null || _c === void 0 ? void 0 : _c[0].link,
            intentData: JSON.stringify(payrexxResponse.data),
            state: client_1.PaymentState.submitted
        };
    }
    async checkIntentStatus({ intentID }) {
        const signature = crypto_1.default.createHmac('sha256', this.instanceAPISecret).digest('base64');
        const res = await (0, node_fetch_1.default)(`https://api.payrexx.com/v1.0/Gateway/${encodeURIComponent(intentID)}/?instance=${encodeURIComponent(this.instanceName)}&ApiSignature=${encodeURIComponent(signature)}`, {
            method: 'GET'
        });
        if (res.status !== 200) {
            (0, server_1.logger)('payrexxPaymentProvider').error('Payrexx response for intent %s is NOK with status %s', intentID, res.status);
            throw new Error(`Payrexx response is NOK with status ${res.status}`);
        }
        const payrexxResponse = await res.json();
        const [gateway] = payrexxResponse.data;
        if (!gateway)
            throw new Error(`Payrexx didn't return a gateway`);
        const state = mapPayrexxEventToPaymentStatus(gateway.status);
        if (!state) {
            (0, server_1.logger)('payrexxPaymentProvider').error('Payrexx gateway with ID: %s for paymentProvider %s returned with an unknown state %s', gateway.id, this.id, gateway.status);
            throw new Error('unknown gateway state');
        }
        if (!gateway.referenceId) {
            (0, server_1.logger)('payrexxPaymentProvider').error('Payrexx gateway with ID: %s for paymentProvider %s returned with empty referenceId', gateway.id, this.id);
            throw new Error('empty referenceId');
        }
        return {
            state,
            paymentID: gateway.referenceId,
            paymentData: JSON.stringify(gateway)
        };
    }
}
exports.PayrexxPaymentProvider = PayrexxPaymentProvider;
//# sourceMappingURL=payrexxPaymentProvider.js.map