"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runJob = exports.JobType = void 0;
const server_1 = require("./server");
const mailContext_1 = require("./mails/mailContext");
var JobType;
(function (JobType) {
    JobType["DailyMembershipRenewal"] = "dailyMembershipRenewal";
    JobType["DailyInvoiceChecker"] = "dailyInvoiceChecker";
    JobType["DailyInvoiceCharger"] = "dailyInvoiceCharger";
    JobType["DailyInvoiceReminder"] = "dailyInvoiceReminder";
    JobType["SendTestMail"] = "sendTestMail";
})(JobType = exports.JobType || (exports.JobType = {}));
async function dailyMembershipRenewal(context, data) {
    (0, server_1.logger)('jobs').info('starting dailyMembershipRenewal');
    const daysToLookAhead = 10;
    const startDate = (data === null || data === void 0 ? void 0 : data.startDate) ? new Date(data === null || data === void 0 ? void 0 : data.startDate) : new Date();
    await context.memberContext.renewSubscriptionForUsers({
        startDate,
        daysToLookAhead
    });
    (0, server_1.logger)('jobs').info('finishing dailyMembershipRenewal');
}
async function dailyInvoiceChecker(context) {
    (0, server_1.logger)('jobs').info('starting dailyInvoiceChecker');
    await context.memberContext.checkOpenInvoices();
    (0, server_1.logger)('jobs').info('finishing dailyInvoiceChecker');
}
async function dailyInvoiceCharger(context) {
    (0, server_1.logger)('jobs').info('starting dailyInvoiceCharger');
    await context.memberContext.chargeOpenInvoices();
    (0, server_1.logger)('jobs').info('finishing dailyInvoiceCharger');
}
async function dailyInvoiceReminder(context, data) {
    (0, server_1.logger)('jobs').info('starting dailyInvoiceReminder');
    const { replyToAddress } = data;
    if (!replyToAddress) {
        throw new Error('No replyToAddress provided');
    }
    await context.memberContext.sendReminderForInvoices({
        replyToAddress
    });
    (0, server_1.logger)('jobs').info('finishing dailyInvoiceReminder');
}
async function sendTestMail(context, data) {
    const { recipient = 'fake@fake.com', message = 'This is a test message' } = data;
    await context.mailContext.sendMail({
        type: mailContext_1.SendMailType.TestMail,
        recipient: recipient,
        data: {
            message
        }
    });
}
async function runJob(command, context, data) {
    switch (command) {
        case JobType.DailyMembershipRenewal:
            await dailyMembershipRenewal(context, data);
            break;
        case JobType.DailyInvoiceChecker:
            await dailyInvoiceChecker(context);
            break;
        case JobType.SendTestMail:
            await sendTestMail(context, data);
            break;
        case JobType.DailyInvoiceReminder:
            await dailyInvoiceReminder(context, data);
            break;
        case JobType.DailyInvoiceCharger:
            await dailyInvoiceCharger(context);
            break;
    }
}
exports.runJob = runJob;
//# sourceMappingURL=jobs.js.map