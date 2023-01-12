"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupMailProvider = exports.BaseMailProvider = exports.MAIL_WEBHOOK_PATH_PREFIX = void 0;
const server_1 = require("../server");
const express_1 = require("express");
const context_1 = require("../context");
const body_parser_1 = __importDefault(require("body-parser"));
exports.MAIL_WEBHOOK_PATH_PREFIX = 'mail-webhooks';
class BaseMailProvider {
    constructor(props) {
        var _a;
        this.id = props.id;
        this.name = props.name;
        this.fromAddress = props.fromAddress;
        this.incomingRequestHandler = (_a = props.incomingRequestHandler) !== null && _a !== void 0 ? _a : body_parser_1.default.json();
    }
}
exports.BaseMailProvider = BaseMailProvider;
function setupMailProvider(opts) {
    const { mailProvider } = opts;
    const mailProviderWebhookRouter = (0, express_1.Router)();
    if (mailProvider) {
        mailProviderWebhookRouter
            .route(`/${mailProvider.id}`)
            .all(mailProvider.incomingRequestHandler, async (req, res, next) => {
            res.status(200).send(); // respond immediately with 200 since webhook was received.
            (0, server_1.logger)('mailProvider').info('Received webhook from %s for mailProvider %s', req.get('origin'), mailProvider.id);
            try {
                const mailLogStatuses = await mailProvider.webhookForSendMail({ req });
                const context = await (0, context_1.contextFromRequest)(req, opts);
                for (const mailLogStatus of mailLogStatuses) {
                    const mailLog = await context.loaders.mailLogsByID.load(mailLogStatus.mailLogID);
                    if (!mailLog)
                        continue; // TODO: handle missing mailLog
                    await context.prisma.mailLog.update({
                        where: { id: mailLog.id },
                        data: {
                            recipient: mailLog.recipient,
                            subject: mailLog.subject,
                            mailProviderID: mailLog.mailProviderID,
                            state: mailLogStatus.state,
                            mailData: mailLogStatus.mailData
                        }
                    });
                }
            }
            catch (error) {
                (0, server_1.logger)('mailProvider').error(error, 'Error during webhook update in mailProvider %s', mailProvider.id);
            }
        });
    }
    return mailProviderWebhookRouter;
}
exports.setupMailProvider = setupMailProvider;
//# sourceMappingURL=mailProvider.js.map