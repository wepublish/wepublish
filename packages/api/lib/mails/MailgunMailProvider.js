"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailgunMailProvider = void 0;
const client_1 = require("@prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const form_data_1 = __importDefault(require("form-data"));
const mailProvider_1 = require("./mailProvider");
function mapMailgunEventToMailLogState(event) {
    switch (event) {
        case 'accepted':
            return client_1.MailLogState.accepted;
        case 'delivered':
            return client_1.MailLogState.delivered;
        case 'failed':
            return client_1.MailLogState.bounced;
        case 'rejected':
            return client_1.MailLogState.rejected;
        default:
            return null;
    }
}
class MailgunMailProvider extends mailProvider_1.BaseMailProvider {
    constructor(props) {
        super(props);
        this.auth = Buffer.from(`api:${props.apiKey}`).toString('base64');
        this.baseDomain = props.baseDomain;
        this.mailDomain = props.mailDomain;
        this.webhookEndpointSecret = props.webhookEndpointSecret;
    }
    verifyWebhookSignature(props) {
        const encodedToken = crypto_1.default
            .createHmac('sha256', this.webhookEndpointSecret)
            .update(props.timestamp.concat(props.token))
            .digest('hex');
        return encodedToken === props.signature;
    }
    async webhookForSendMail({ req }) {
        const { body } = req;
        if (!body.signature)
            throw new Error('No signature in webhook body');
        const { signature, token, timestamp } = body.signature;
        if (!timestamp ||
            !token ||
            !signature ||
            !this.verifyWebhookSignature({ timestamp, token, signature }))
            throw new Error('Webhook signature failed');
        const mailLogStatuses = [];
        if (!body['event-data'])
            throw new Error('No event-data in webhook body');
        const state = mapMailgunEventToMailLogState(body['event-data'].event);
        if (!body['event-data']['user-variables'])
            throw new Error('No user-variables in webhook body');
        const mailLogID = body['event-data']['user-variables'].mail_log_id;
        if (state !== null && mailLogID !== undefined) {
            mailLogStatuses.push({
                state,
                mailLogID,
                mailData: JSON.stringify(body['event-data'])
            });
        }
        return Promise.resolve(mailLogStatuses);
    }
    async sendMail(props) {
        return new Promise((resolve, reject) => {
            var _a;
            const form = new form_data_1.default();
            form.append('from', this.fromAddress);
            form.append('to', props.recipient);
            form.append('subject', props.subject);
            form.append('text', (_a = props.message) !== null && _a !== void 0 ? _a : '');
            if (props.messageHtml) {
                form.append('html', props.messageHtml);
            }
            if (props.template) {
                form.append('template', props.template);
                for (const [key, value] of Object.entries(props.templateData || {})) {
                    const serializedValue = typeof value === 'string' || typeof value === 'number'
                        ? `${value}`
                        : JSON.stringify(value);
                    form.append(`v:${key}`, serializedValue);
                }
            }
            form.append('v:mail_log_id', props.mailLogID);
            form.submit({
                protocol: 'https:',
                host: this.baseDomain,
                path: `/v3/${this.mailDomain}/messages`,
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Basic ${this.auth}`
                }
            }, (err, res) => {
                return err || res.statusCode !== 200 ? reject(err || res) : resolve();
            });
        });
    }
}
exports.MailgunMailProvider = MailgunMailProvider;
//# sourceMappingURL=MailgunMailProvider.js.map