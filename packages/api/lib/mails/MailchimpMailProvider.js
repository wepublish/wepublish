"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailchimpMailProvider = void 0;
const mandrill_api_1 = require("mandrill-api");
const crypto_1 = __importDefault(require("crypto"));
const mailProvider_1 = require("./mailProvider");
const server_1 = require("../server");
const client_1 = require("@prisma/client");
function mapMandrillEventToMailLogState(event) {
    switch (event) {
        case 'send':
            return client_1.MailLogState.delivered;
        case 'deferral':
            return client_1.MailLogState.deferred;
        case 'hard_bounce':
        case 'soft_bounce':
            return client_1.MailLogState.bounced;
        case 'reject':
            return client_1.MailLogState.rejected;
        default:
            return null;
    }
}
/*
 * Function flattens an object for Mandrill template engine. Since the template engine does not support
 * nested objects. Separator is "_"
 */
function flattenObj(ob) {
    const nestedObject = {};
    for (const i in ob) {
        if (typeof ob[i] === 'object' && !Array.isArray(ob[i])) {
            const returnedNestedObject = flattenObj(ob[i]);
            for (const j in returnedNestedObject) {
                nestedObject[i + '_' + j] = returnedNestedObject[j];
            }
        }
        else {
            nestedObject[i] = ob[i];
        }
    }
    return nestedObject;
}
class MailchimpMailProvider extends mailProvider_1.BaseMailProvider {
    constructor(props) {
        super(props);
        this.mandrill = new mandrill_api_1.Mandrill(props.apiKey);
        this.webhookEndpointSecret = props.webhookEndpointSecret;
    }
    verifyWebhookSignature({ signature, url, params }) {
        const keys = Object.keys(params).sort();
        const longString = keys.reduce((sig, key) => {
            return sig + key + params[key];
        }, url || '');
        const generatedSignature = crypto_1.default
            .createHmac('sha1', this.webhookEndpointSecret)
            .update(longString)
            .digest('base64');
        return signature === generatedSignature;
    }
    webhookForSendMail({ req }) {
        var _a, _b;
        if (req.method !== 'POST')
            return Promise.resolve([]);
        if (typeof req.headers['x-mandrill-signature'] !== 'string')
            throw new Error('Webhook Header is missing signature ');
        if (!this.verifyWebhookSignature({
            signature: req.headers['x-mandrill-signature'],
            url: `https://${req.headers.host}${req.originalUrl}`,
            params: req.body
        }))
            throw new Error('Webhook signature failed');
        const mandrillEvents = JSON.parse(req.body.mandrill_events);
        const mailLogStatuses = [];
        for (const mandrillEvent of mandrillEvents) {
            const state = mapMandrillEventToMailLogState(mandrillEvent.event);
            const mailLogID = (_b = (_a = mandrillEvent === null || mandrillEvent === void 0 ? void 0 : mandrillEvent.msg) === null || _a === void 0 ? void 0 : _a.metadata) === null || _b === void 0 ? void 0 : _b.mail_log_id;
            if (state !== null && mailLogID !== undefined) {
                mailLogStatuses.push({
                    state,
                    mailLogID,
                    mailData: JSON.stringify(mandrillEvent)
                });
            }
        }
        return Promise.resolve(mailLogStatuses);
    }
    async sendMail(props) {
        if (props.template) {
            try {
                const templateContent = [];
                const flattenedObject = flattenObj(props.templateData);
                for (const [key, value] of Object.entries(flattenedObject || {})) {
                    templateContent.push({
                        name: key,
                        content: value
                    });
                }
                await new Promise((resolve, reject) => {
                    this.mandrill.messages.sendTemplate({
                        template_name: props.template,
                        template_content: [],
                        message: {
                            text: props.message,
                            subject: props.subject,
                            from_email: this.fromAddress,
                            to: [
                                {
                                    email: props.recipient,
                                    type: 'to'
                                }
                            ],
                            merge_vars: [
                                {
                                    rcpt: props.recipient,
                                    vars: templateContent
                                }
                            ],
                            metadata: {
                                mail_log_id: props.mailLogID
                            }
                        }
                    }, resolve, reject);
                });
            }
            catch (error) {
                (0, server_1.logger)('mailchimpMailProvider').error(error, `sendTemplate returned NOK`);
            }
        }
        else {
            try {
                await new Promise((resolve, reject) => {
                    this.mandrill.messages.send({
                        message: {
                            html: props.messageHtml,
                            text: props.message,
                            subject: props.subject,
                            from_email: this.fromAddress,
                            to: [
                                {
                                    email: props.recipient,
                                    type: 'to'
                                }
                            ],
                            metadata: {
                                mail_log_id: props.mailLogID
                            }
                        }
                    }, resolve, reject);
                });
            }
            catch (error) {
                (0, server_1.logger)('mailchimpMailProvider').error(error, `send returned NOK`);
            }
        }
    }
}
exports.MailchimpMailProvider = MailchimpMailProvider;
//# sourceMappingURL=MailchimpMailProvider.js.map