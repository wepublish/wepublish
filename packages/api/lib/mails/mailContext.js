"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailContext = exports.SendMailType = void 0;
const client_1 = require("@prisma/client");
const email_templates_1 = __importDefault(require("email-templates"));
const server_1 = require("../server");
var SendMailType;
(function (SendMailType) {
    SendMailType[SendMailType["LoginLink"] = 0] = "LoginLink";
    SendMailType[SendMailType["TestMail"] = 1] = "TestMail";
    SendMailType[SendMailType["PasswordReset"] = 2] = "PasswordReset";
    SendMailType[SendMailType["NewMemberSubscription"] = 3] = "NewMemberSubscription";
    SendMailType[SendMailType["RenewedMemberSubscription"] = 4] = "RenewedMemberSubscription";
    SendMailType[SendMailType["MemberSubscriptionOffSessionBefore"] = 5] = "MemberSubscriptionOffSessionBefore";
    SendMailType[SendMailType["MemberSubscriptionOnSessionBefore"] = 6] = "MemberSubscriptionOnSessionBefore";
    SendMailType[SendMailType["MemberSubscriptionOnSessionAfter"] = 7] = "MemberSubscriptionOnSessionAfter";
    SendMailType[SendMailType["MemberSubscriptionOffSessionFailed"] = 8] = "MemberSubscriptionOffSessionFailed";
})(SendMailType = exports.SendMailType || (exports.SendMailType = {}));
class MailContext {
    constructor(props) {
        var _a, _b;
        this.mailProvider = (_a = props.mailProvider) !== null && _a !== void 0 ? _a : null;
        this.prisma = props.prisma;
        this.defaultFromAddress = props.defaultFromAddress;
        this.defaultReplyToAddress = props.defaultReplyToAddress;
        this.email = new email_templates_1.default({
            send: false,
            // textOnly: true,
            views: {
                root: props.mailTemplatesPath
            }
        });
        this.mailTemplateMaps = (_b = props.mailTemplateMaps) !== null && _b !== void 0 ? _b : [];
    }
    async sendMail({ type, recipient, data }) {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        // const type = SendMailType.LoginLink
        const mailTemplate = this.mailTemplateMaps.find(template => template.type === type);
        if (!mailTemplate) {
            (0, server_1.logger)('mailContext').warn(`Template for type: ${type} not found`);
            return;
        }
        const mailView = mailTemplate.local && mailTemplate.localTemplate
            ? await this.email.renderAll(mailTemplate.localTemplate, data)
            : undefined;
        const mailLog = await this.prisma.mailLog.create({
            data: {
                state: client_1.MailLogState.submitted,
                subject: (_b = (_a = mailView === null || mailView === void 0 ? void 0 : mailView.subject) !== null && _a !== void 0 ? _a : mailTemplate.subject) !== null && _b !== void 0 ? _b : 'N/A',
                recipient: recipient,
                mailProviderID: (_d = (_c = this.mailProvider) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : 'N/A',
                modifiedAt: new Date()
            }
        });
        if (this.mailProvider) {
            await this.mailProvider.sendMail({
                mailLogID: mailLog.id,
                recipient: recipient,
                replyToAddress: (_f = (_e = mailTemplate.replyToAddress) !== null && _e !== void 0 ? _e : this.defaultReplyToAddress) !== null && _f !== void 0 ? _f : this.defaultFromAddress,
                subject: (_h = (_g = mailView === null || mailView === void 0 ? void 0 : mailView.subject) !== null && _g !== void 0 ? _g : mailTemplate.subject) !== null && _h !== void 0 ? _h : '',
                message: mailView === null || mailView === void 0 ? void 0 : mailView.text,
                messageHtml: mailView === null || mailView === void 0 ? void 0 : mailView.html,
                template: mailTemplate.remoteTemplate,
                templateData: data
            });
        }
    }
}
exports.MailContext = MailContext;
//# sourceMappingURL=mailContext.js.map