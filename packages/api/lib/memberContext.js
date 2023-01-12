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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemberContext = exports.calculateAmountForPeriodicity = exports.getNextDateForPeriodicity = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("./db/common");
const setting_1 = require("./db/setting");
const user_1 = require("./db/user");
const error_1 = require("./error");
const mailContext_1 = require("./mails/mailContext");
const server_1 = require("./server");
const utility_1 = require("./utility");
function getNextDateForPeriodicity(start, periodicity) {
    start = new Date(start.getTime() - utility_1.ONE_DAY_IN_MILLISECONDS); // create new Date object
    switch (periodicity) {
        case client_1.PaymentPeriodicity.monthly:
            return new Date(start.setMonth(start.getMonth() + 1));
        case client_1.PaymentPeriodicity.quarterly:
            return new Date(start.setMonth(start.getMonth() + 3));
        case client_1.PaymentPeriodicity.biannual:
            return new Date(start.setMonth(start.getMonth() + 6));
        case client_1.PaymentPeriodicity.yearly:
            return new Date(start.setMonth(start.getMonth() + 12));
    }
}
exports.getNextDateForPeriodicity = getNextDateForPeriodicity;
function calculateAmountForPeriodicity(monthlyAmount, periodicity) {
    switch (periodicity) {
        case client_1.PaymentPeriodicity.monthly:
            return monthlyAmount;
        case client_1.PaymentPeriodicity.quarterly:
            return monthlyAmount * 3;
        case client_1.PaymentPeriodicity.biannual:
            return monthlyAmount * 6;
        case client_1.PaymentPeriodicity.yearly:
            return monthlyAmount * 12;
    }
}
exports.calculateAmountForPeriodicity = calculateAmountForPeriodicity;
function getNextReminderAndDeactivationDate({ sentReminderAt, createdAt, frequency, maxAttempts }) {
    const invoiceReminderFrequencyInDays = frequency || 3;
    const invoiceReminderMaxTries = maxAttempts || 5;
    const nextReminder = new Date(sentReminderAt.getTime() +
        invoiceReminderFrequencyInDays * utility_1.ONE_DAY_IN_MILLISECONDS -
        utility_1.ONE_HOUR_IN_MILLISECONDS);
    const deactivateSubscription = new Date(createdAt.getTime() +
        invoiceReminderFrequencyInDays * invoiceReminderMaxTries * utility_1.ONE_DAY_IN_MILLISECONDS -
        utility_1.ONE_HOUR_IN_MILLISECONDS);
    return {
        nextReminder,
        deactivateSubscription
    };
}
class MemberContext {
    constructor(props) {
        this.loaders = props.loaders;
        this.paymentProviders = props.paymentProviders;
        this.prisma = props.prisma;
        this.mailContext = props.mailContext;
        this.getLoginUrlForUser = props.getLoginUrlForUser;
    }
    async handleSubscriptionChange({ subscription }) {
        // Check if user has any unpaid Periods and delete them and their invoices if so
        const invoices = await this.prisma.invoice.findMany({
            where: {
                subscriptionID: subscription.id
            },
            include: {
                items: true
            }
        });
        const openInvoice = invoices.find(invoice => (invoice === null || invoice === void 0 ? void 0 : invoice.paidAt) === null && (invoice === null || invoice === void 0 ? void 0 : invoice.canceledAt) === null);
        if (openInvoice || subscription.paidUntil === null || subscription.paidUntil <= new Date()) {
            const periodToDelete = subscription.periods.find(period => period.invoiceID === (openInvoice === null || openInvoice === void 0 ? void 0 : openInvoice.id));
            if (periodToDelete) {
                await this.prisma.subscription.update({
                    where: { id: subscription.id },
                    data: {
                        periods: {
                            delete: {
                                id: periodToDelete.id
                            }
                        }
                    }
                });
            }
            if (openInvoice) {
                await this.prisma.invoice.delete({
                    where: { id: openInvoice.id }
                });
            }
            const finalUpdatedSubscription = await this.prisma.subscription.findUnique({
                where: { id: subscription.id },
                include: {
                    deactivation: true,
                    periods: true,
                    properties: true
                }
            });
            if (!finalUpdatedSubscription)
                throw new Error('Error during updateSubscription');
            // renew user subscription
            await this.renewSubscriptionForUser({
                subscription: finalUpdatedSubscription
            });
            return finalUpdatedSubscription;
        }
        return subscription;
    }
    async renewSubscriptionForUser({ subscription }) {
        try {
            const { periods = [], paidUntil, deactivation } = subscription;
            if (deactivation) {
                (0, server_1.logger)('memberContext').info('Subscription with id %s is deactivated and will not be renewed', subscription.id);
                return null;
            }
            periods.sort((periodA, periodB) => {
                if (periodA.endsAt < periodB.endsAt)
                    return -1;
                if (periodA.endsAt > periodB.endsAt)
                    return 1;
                return 0;
            });
            if (periods.length > 0 &&
                (paidUntil === null ||
                    (paidUntil !== null && periods[periods.length - 1].endsAt > paidUntil))) {
                const period = periods[periods.length - 1];
                const invoice = await this.prisma.invoice.findUnique({
                    where: {
                        id: period.invoiceID
                    },
                    include: {
                        items: true
                    }
                });
                // only return the invoice if it hasn't been canceled. Otherwise
                // create a new period and a new invoice
                if (!(invoice === null || invoice === void 0 ? void 0 : invoice.canceledAt)) {
                    return invoice;
                }
            }
            const startDate = new Date(paidUntil && paidUntil.getTime() > new Date().getTime() - utility_1.ONE_MONTH_IN_MILLISECONDS
                ? paidUntil.getTime() + utility_1.ONE_DAY_IN_MILLISECONDS
                : new Date().getTime());
            const nextDate = getNextDateForPeriodicity(startDate, subscription.paymentPeriodicity);
            const amount = calculateAmountForPeriodicity(subscription.monthlyAmount, subscription.paymentPeriodicity);
            const user = await this.prisma.user.findUnique({
                where: {
                    id: subscription.userID
                },
                select: user_1.unselectPassword
            });
            if (!user) {
                (0, server_1.logger)('memberContext').info('User with id "%s" not found', subscription.userID);
                return null;
            }
            const newInvoice = await this.prisma.invoice.create({
                data: {
                    subscriptionID: subscription.id,
                    description: `Membership from ${startDate.toISOString()} for ${user.name || user.email}`,
                    mail: user.email,
                    dueAt: startDate,
                    items: {
                        create: {
                            name: 'Membership',
                            description: `From ${startDate.toISOString()} to ${nextDate.toISOString()}`,
                            amount,
                            quantity: 1
                        }
                    }
                },
                include: {
                    items: true
                }
            });
            await this.prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    periods: {
                        create: {
                            amount: amount,
                            paymentPeriodicity: subscription.paymentPeriodicity,
                            startsAt: startDate,
                            endsAt: nextDate,
                            invoiceID: newInvoice.id
                        }
                    }
                }
            });
            (0, server_1.logger)('memberContext').info('Renewed subscription with id %s', subscription.id);
            return newInvoice;
        }
        catch (error) {
            (0, server_1.logger)('memberContext').error(error, 'Error while renewing subscription with id %s', subscription.id);
        }
        return null;
    }
    async renewSubscriptionForUsers({ startDate = new Date(), daysToLookAhead }) {
        if (daysToLookAhead < 1) {
            throw Error('Days to look ahead must not be lower than 1');
        }
        const lookAheadDate = new Date(startDate.getTime() + daysToLookAhead * utility_1.ONE_DAY_IN_MILLISECONDS);
        const subscriptionsPaidUntil = [];
        // max batches is a security feature, which prevents in case of an auto-renew bug too many people are going to be charged unintentionally.
        const maxSubscriptionBatch = parseInt(process.env.MAX_AUTO_RENEW_SUBSCRIPTION_BATCH || 'false');
        const batchSize = Math.min(maxSubscriptionBatch, common_1.MaxResultsPerPage) || common_1.MaxResultsPerPage;
        let hasMore = true;
        let cursor = null;
        while (hasMore) {
            const subscriptions = await this.prisma.subscription.findMany({
                where: {
                    autoRenew: true,
                    paidUntil: {
                        lte: lookAheadDate
                    },
                    deactivation: null
                },
                orderBy: {
                    createdAt: 'asc'
                },
                skip: cursor ? 1 : 0,
                take: 100,
                cursor: cursor
                    ? {
                        id: cursor
                    }
                    : undefined,
                include: {
                    deactivation: true,
                    periods: true,
                    properties: true
                }
            });
            hasMore = Boolean(subscriptions === null || subscriptions === void 0 ? void 0 : subscriptions.length);
            cursor = (subscriptions === null || subscriptions === void 0 ? void 0 : subscriptions.length) ? subscriptions[subscriptions.length - 1].id : null;
            subscriptionsPaidUntil.push(...subscriptions);
        }
        const subscriptionPaidNull = [];
        hasMore = true;
        cursor = null;
        while (hasMore) {
            const subscriptions = await this.prisma.subscription.findMany({
                where: {
                    autoRenew: true,
                    paidUntil: null,
                    deactivation: null
                },
                orderBy: {
                    createdAt: 'asc'
                },
                skip: cursor ? 1 : 0,
                take: batchSize,
                cursor: cursor
                    ? {
                        id: cursor
                    }
                    : undefined,
                include: {
                    deactivation: true,
                    periods: true,
                    properties: true
                }
            });
            hasMore = Boolean(subscriptions === null || subscriptions === void 0 ? void 0 : subscriptions.length);
            cursor = (subscriptions === null || subscriptions === void 0 ? void 0 : subscriptions.length) ? subscriptions[subscriptions.length - 1].id : null;
            subscriptionPaidNull.push(...subscriptions);
        }
        for (const subscription of [...subscriptionsPaidUntil, ...subscriptionPaidNull]) {
            await this.renewSubscriptionForUser({ subscription });
        }
    }
    async checkOpenInvoices() {
        var _a;
        const openInvoices = await this.getAllOpenInvoices();
        for (const invoice of openInvoices) {
            const subscription = await this.prisma.subscription.findUnique({
                where: {
                    id: (_a = invoice.subscriptionID) !== null && _a !== void 0 ? _a : ''
                }
            });
            if (!subscription) {
                (0, server_1.logger)('memberContext').warn('subscription "%s" not found', invoice.subscriptionID);
                continue;
            }
            await this.checkOpenInvoice({ invoice });
        }
    }
    async checkOpenInvoice({ invoice }) {
        const paymentMethods = await this.prisma.paymentMethod.findMany();
        const payments = await this.prisma.payment.findMany({
            where: {
                invoiceID: invoice.id
            }
        });
        for (const payment of payments) {
            if (!(payment === null || payment === void 0 ? void 0 : payment.intentID)) {
                (0, server_1.logger)('memberContext').error('Payment %s does not have an intentID', payment === null || payment === void 0 ? void 0 : payment.id);
                continue;
            }
            const paymentMethod = paymentMethods.find(method => method.id === payment.paymentMethodID);
            if (!paymentMethod) {
                (0, server_1.logger)('memberContext').error('PaymentMethod %s does not exist', payment.paymentMethodID);
                continue;
            }
            const paymentProvider = this.paymentProviders.find(provider => provider.id === paymentMethod.paymentProviderID);
            if (!paymentProvider) {
                (0, server_1.logger)('memberContext').error('PaymentProvider %s does not exist', paymentMethod.paymentProviderID);
                continue;
            }
            try {
                const intentState = await paymentProvider.checkIntentStatus({
                    intentID: payment.intentID
                });
                await paymentProvider.updatePaymentWithIntentState({
                    intentState,
                    paymentClient: this.prisma.payment,
                    paymentsByID: this.loaders.paymentsByID,
                    invoicesByID: this.loaders.invoicesByID,
                    subscriptionClient: this.prisma.subscription,
                    userClient: this.prisma.user,
                    invoiceClient: this.prisma.invoice,
                    subscriptionPeriodClient: this.prisma.subscriptionPeriod,
                    invoiceItemClient: this.prisma.invoiceItem
                });
                // FIXME: We need to implement a way to wait for all the database
                //  event hooks to finish before we return data. Will be solved in WPC-498
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            catch (error) {
                (0, server_1.logger)('memberContext').error(error, 'Checking Intent State for Payment %s failed', payment === null || payment === void 0 ? void 0 : payment.id);
            }
        }
    }
    getOffSessionPaymentProviderIDs() {
        return this.paymentProviders
            .filter(provider => provider.offSessionPayments)
            .map(provider => provider.id);
    }
    async getAllOpenInvoices() {
        const openInvoices = [];
        let hasMore = true;
        let cursor = null;
        while (hasMore) {
            const invoices = await this.prisma.invoice.findMany({
                where: {
                    paidAt: null,
                    canceledAt: null
                },
                orderBy: {
                    createdAt: 'asc'
                },
                skip: cursor ? 1 : 0,
                take: 100,
                cursor: cursor
                    ? {
                        id: cursor
                    }
                    : undefined,
                include: {
                    items: true
                }
            });
            hasMore = Boolean(invoices === null || invoices === void 0 ? void 0 : invoices.length);
            cursor = (invoices === null || invoices === void 0 ? void 0 : invoices.length) ? invoices[invoices.length - 1].id : null;
            openInvoices.push(...invoices);
        }
        return openInvoices;
    }
    async chargeOpenInvoices() {
        var _a, _b, _c, _d, _e;
        const today = new Date();
        const openInvoices = await this.getAllOpenInvoices();
        const offSessionPaymentProvidersID = this.getOffSessionPaymentProviderIDs();
        for (const invoice of openInvoices) {
            const subscription = await this.prisma.subscription.findUnique({
                where: {
                    id: (_a = invoice.subscriptionID) !== null && _a !== void 0 ? _a : ''
                }
            });
            if (!subscription) {
                (0, server_1.logger)('memberContext').warn('subscription %s does not exist', invoice.subscriptionID);
                continue;
            }
            if (invoice.sentReminderAt) {
                const frequencySetting = await this.prisma.setting.findUnique({
                    where: { name: setting_1.SettingName.INVOICE_REMINDER_FREQ }
                });
                const frequency = (_b = frequencySetting === null || frequencySetting === void 0 ? void 0 : frequencySetting.value) !== null && _b !== void 0 ? _b : parseInt((_c = process.env.INVOICE_REMINDER_FREQ) !== null && _c !== void 0 ? _c : '');
                const maxAttemptsSetting = await this.prisma.setting.findUnique({
                    where: { name: setting_1.SettingName.INVOICE_REMINDER_MAX_TRIES }
                });
                const maxAttempts = (_d = maxAttemptsSetting === null || maxAttemptsSetting === void 0 ? void 0 : maxAttemptsSetting.value) !== null && _d !== void 0 ? _d : parseInt((_e = process.env.INVOICE_REMINDER_MAX_TRIES) !== null && _e !== void 0 ? _e : '');
                const { nextReminder, deactivateSubscription } = getNextReminderAndDeactivationDate({
                    sentReminderAt: invoice.sentReminderAt,
                    createdAt: invoice.createdAt,
                    frequency: frequency,
                    maxAttempts: maxAttempts
                });
                if (nextReminder > today) {
                    continue; // skip reminder if not enough days passed
                }
                if (deactivateSubscription < today) {
                    const { items } = invoice, invoiceData = __rest(invoice, ["items"]);
                    await this.prisma.invoice.update({
                        where: { id: invoice.id },
                        data: Object.assign(Object.assign({}, invoiceData), { items: {
                                deleteMany: {
                                    invoiceId: invoiceData.id
                                },
                                create: items.map((_a) => {
                                    var { invoiceId } = _a, item = __rest(_a, ["invoiceId"]);
                                    return item;
                                })
                            }, canceledAt: today })
                    });
                    await this.deactivateSubscriptionForUser({
                        subscriptionID: subscription.id,
                        deactivationDate: today,
                        deactivationReason: client_1.SubscriptionDeactivationReason.invoiceNotPaid
                    });
                    continue;
                }
            }
            const user = await this.prisma.user.findUnique({
                where: { id: subscription.userID },
                select: user_1.unselectPassword
            });
            if (!user) {
                (0, server_1.logger)('memberContext').warn('user %s not found', subscription.userID);
                continue;
            }
            if (!user.active) {
                (0, server_1.logger)('memberContext').warn('user %s is not active', user.id);
                continue;
            }
            const paymentMethod = await this.loaders.paymentMethodsByID.load(subscription.paymentMethodID);
            if (!paymentMethod) {
                (0, server_1.logger)('memberContext').warn('paymentMethod %s not found', subscription.paymentMethodID);
                continue;
            }
            if (offSessionPaymentProvidersID.includes(paymentMethod.paymentProviderID)) {
                const customer = user.paymentProviderCustomers.find(ppc => ppc.paymentProviderID === paymentMethod.paymentProviderID);
                if (!customer) {
                    (0, server_1.logger)('memberContext').warn('PaymentCustomer %s on user %s not found', paymentMethod.paymentProviderID, user.id);
                    await this.mailContext.sendMail({
                        type: mailContext_1.SendMailType.MemberSubscriptionOffSessionFailed,
                        recipient: invoice.mail,
                        data: Object.assign(Object.assign({ user }, (user ? { loginURL: this.getLoginUrlForUser(user) } : {})), { invoice, paymentProviderID: paymentMethod.paymentProviderID, errorCode: 'customer_missing', subscription })
                    });
                    continue;
                }
                await this.chargeInvoice({
                    user,
                    invoice,
                    paymentMethodID: paymentMethod.id,
                    customer
                });
            }
        }
    }
    async chargeInvoice({ user, invoice, paymentMethodID, customer }) {
        const offSessionPaymentProvidersID = this.getOffSessionPaymentProviderIDs();
        const paymentMethods = await this.prisma.paymentMethod.findMany();
        const paymentMethodIDs = paymentMethods
            .filter(method => offSessionPaymentProvidersID.includes(method.paymentProviderID))
            .map(method => method.id);
        if (!paymentMethodIDs.includes(paymentMethodID)) {
            (0, server_1.logger)('memberContext').warn('PaymentMethod %s does not support off session payments', paymentMethodID);
            return false;
        }
        const paymentMethod = paymentMethods.find(method => method.id === paymentMethodID);
        if (!paymentMethod) {
            (0, server_1.logger)('memberContext').error('PaymentMethod %s does not exist', paymentMethodID);
            return false;
        }
        const paymentProvider = this.paymentProviders.find(provider => provider.id === paymentMethod.paymentProviderID);
        if (!paymentProvider) {
            (0, server_1.logger)('memberContext').error('PaymentProvider %s does not exist', paymentMethod.paymentProviderID);
            return false;
        }
        const payment = await this.prisma.payment.create({
            data: {
                paymentMethodID,
                invoiceID: invoice.id,
                state: client_1.PaymentState.created
            }
        });
        const intent = await paymentProvider.createIntent({
            paymentID: payment.id,
            invoice,
            saveCustomer: false,
            customerID: customer.customerID
        });
        const updatedPayment = await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
                state: intent.state,
                intentID: intent.intentID,
                intentData: intent.intentData,
                intentSecret: intent.intentSecret,
                paymentData: intent.paymentData,
                paymentMethodID: payment.paymentMethodID,
                invoiceID: payment.invoiceID
            }
        });
        if (intent.state === client_1.PaymentState.requiresUserAction) {
            await this.mailContext.sendMail({
                type: mailContext_1.SendMailType.MemberSubscriptionOffSessionFailed,
                recipient: invoice.mail,
                data: Object.assign(Object.assign({ user }, (user ? { loginURL: this.getLoginUrlForUser(user) } : {})), { invoice, paymentProviderID: paymentProvider.id, errorCode: intent.errorCode })
            });
            const { items } = invoice, invoiceData = __rest(invoice, ["items"]);
            await this.prisma.invoice.update({
                where: { id: invoice.id },
                data: Object.assign(Object.assign({}, invoiceData), { items: {
                        deleteMany: {
                            invoiceId: invoiceData.id
                        },
                        create: items.map((_a) => {
                            var { invoiceId } = _a, item = __rest(_a, ["invoiceId"]);
                            return item;
                        })
                    }, sentReminderAt: new Date() })
            });
            return updatedPayment;
        }
        return updatedPayment;
    }
    async sendReminderForInvoices({ replyToAddress }) {
        var _a, _b, _c, _d, _e;
        const today = new Date();
        const openInvoices = await this.getAllOpenInvoices();
        if (openInvoices.length === 0) {
            (0, server_1.logger)('memberContext').info('No open invoices to remind');
        }
        for (const invoice of openInvoices) {
            const subscription = await this.prisma.subscription.findUnique({
                where: {
                    id: (_a = invoice.subscriptionID) !== null && _a !== void 0 ? _a : ''
                }
            });
            if (!subscription) {
                (0, server_1.logger)('memberContext').warn('subscription %s does not exist', invoice.subscriptionID);
                continue;
            }
            if (invoice.sentReminderAt) {
                const frequencySetting = await this.prisma.setting.findUnique({
                    where: { name: setting_1.SettingName.INVOICE_REMINDER_FREQ }
                });
                const frequency = (_b = frequencySetting === null || frequencySetting === void 0 ? void 0 : frequencySetting.value) !== null && _b !== void 0 ? _b : parseInt((_c = process.env.INVOICE_REMINDER_FREQ) !== null && _c !== void 0 ? _c : '');
                const maxAttemptsSetting = await this.prisma.setting.findUnique({
                    where: { name: setting_1.SettingName.INVOICE_REMINDER_MAX_TRIES }
                });
                const maxAttempts = (_d = maxAttemptsSetting === null || maxAttemptsSetting === void 0 ? void 0 : maxAttemptsSetting.value) !== null && _d !== void 0 ? _d : parseInt((_e = process.env.INVOICE_REMINDER_MAX_TRIES) !== null && _e !== void 0 ? _e : '');
                const { nextReminder, deactivateSubscription } = getNextReminderAndDeactivationDate({
                    sentReminderAt: invoice.sentReminderAt,
                    createdAt: invoice.createdAt,
                    frequency: frequency,
                    maxAttempts: maxAttempts
                });
                if (nextReminder > today) {
                    continue; // skip reminder if not enough days passed
                }
                if (deactivateSubscription < today) {
                    const { items } = invoice, invoiceData = __rest(invoice, ["items"]);
                    await this.prisma.invoice.update({
                        where: { id: invoice.id },
                        data: Object.assign(Object.assign({}, invoiceData), { items: {
                                deleteMany: {
                                    invoiceId: invoiceData.id
                                },
                                create: items.map((_a) => {
                                    var { invoiceId } = _a, item = __rest(_a, ["invoiceId"]);
                                    return item;
                                })
                            }, canceledAt: today })
                    });
                    await this.deactivateSubscriptionForUser({
                        subscriptionID: subscription.id,
                        deactivationDate: today,
                        deactivationReason: client_1.SubscriptionDeactivationReason.invoiceNotPaid
                    });
                    continue;
                }
            }
            const user = await this.prisma.user.findUnique({
                where: { id: subscription.userID },
                select: user_1.unselectPassword
            });
            if (!user) {
                (0, server_1.logger)('memberContext').warn('user %s not found', subscription.userID);
                continue;
            }
            if (!user.active) {
                (0, server_1.logger)('memberContext').warn('user %s is not active', user.id);
                continue;
            }
            try {
                await this.sendReminderForInvoice({
                    invoice,
                    replyToAddress
                });
            }
            catch (error) {
                (0, server_1.logger)('memberContext').error(error, 'Error while sending reminder');
            }
        }
    }
    async sendReminderForInvoice({ invoice, replyToAddress }) {
        var _a;
        const today = new Date();
        if (!invoice.subscriptionID) {
            throw new error_1.NotFound('Invoice', invoice.id);
        }
        const subscription = await this.prisma.subscription.findUnique({
            where: {
                id: invoice.subscriptionID
            },
            include: {
                deactivation: true,
                periods: true,
                properties: true
            }
        });
        const user = (subscription === null || subscription === void 0 ? void 0 : subscription.userID)
            ? await this.prisma.user.findUnique({
                where: {
                    id: subscription.userID
                },
                select: user_1.unselectPassword
            })
            : null;
        const paymentMethod = subscription
            ? await this.loaders.paymentMethodsByID.load(subscription.paymentMethodID)
            : null;
        const paymentProvider = (paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.paymentProviderID)
            ? this.paymentProviders.find(provider => provider.id === paymentMethod.paymentProviderID)
            : null;
        const offSessionPayments = (_a = paymentProvider === null || paymentProvider === void 0 ? void 0 : paymentProvider.offSessionPayments) !== null && _a !== void 0 ? _a : false;
        if (offSessionPayments) {
            if (invoice.dueAt > today) {
                await this.mailContext.sendMail({
                    type: mailContext_1.SendMailType.MemberSubscriptionOffSessionBefore,
                    recipient: invoice.mail,
                    data: Object.assign(Object.assign({ invoice,
                        user }, (user ? { loginURL: this.getLoginUrlForUser(user) } : {})), { subscription })
                });
            }
            else {
                // system will try to bill every night and send error to user.
            }
        }
        else {
            if (invoice.dueAt > today) {
                await this.mailContext.sendMail({
                    type: mailContext_1.SendMailType.MemberSubscriptionOnSessionBefore,
                    recipient: invoice.mail,
                    data: Object.assign(Object.assign({ invoice,
                        user }, (user ? { loginURL: this.getLoginUrlForUser(user) } : {})), { subscription })
                });
            }
            else {
                await this.mailContext.sendMail({
                    type: mailContext_1.SendMailType.MemberSubscriptionOnSessionAfter,
                    recipient: invoice.mail,
                    data: Object.assign(Object.assign({ invoice,
                        user }, (user ? { loginURL: this.getLoginUrlForUser(user) } : {})), { subscription })
                });
            }
        }
        const { items } = invoice, invoiceData = __rest(invoice, ["items"]);
        await this.prisma.invoice.update({
            where: { id: invoice.id },
            data: Object.assign(Object.assign({}, invoiceData), { items: {
                    deleteMany: {
                        invoiceId: invoiceData.id
                    },
                    create: items.map((_a) => {
                        var { invoiceId } = _a, item = __rest(_a, ["invoiceId"]);
                        return item;
                    })
                }, sentReminderAt: today })
        });
    }
    async cancelInvoicesForSubscription(subscriptionID) {
        // Cancel invoices when subscription is canceled
        const invoices = await this.prisma.invoice.findMany({
            where: {
                subscriptionID: subscriptionID
            }
        });
        for (const invoice of invoices) {
            if (!invoice || invoice.paidAt !== null || invoice.canceledAt !== null)
                continue;
            await this.prisma.invoice.update({
                where: {
                    id: invoice.id
                },
                data: {
                    canceledAt: new Date()
                }
            });
        }
    }
    async deactivateSubscriptionForUser({ subscriptionID, deactivationDate, deactivationReason }) {
        var _a, _b;
        const subscription = await this.prisma.subscription.findUnique({
            where: { id: subscriptionID },
            include: {
                deactivation: true,
                periods: true,
                properties: true
            }
        });
        if (!subscription) {
            (0, server_1.logger)('memberContext').info('Subscription with id "%s" does not exist', subscriptionID);
            return;
        }
        await this.cancelInvoicesForSubscription(subscriptionID);
        await this.prisma.subscription.update({
            where: { id: subscriptionID },
            data: {
                paymentPeriodicity: subscription.paymentPeriodicity,
                deactivation: {
                    upsert: {
                        create: {
                            date: (_a = deactivationDate !== null && deactivationDate !== void 0 ? deactivationDate : subscription.paidUntil) !== null && _a !== void 0 ? _a : new Date(),
                            reason: deactivationReason !== null && deactivationReason !== void 0 ? deactivationReason : client_1.SubscriptionDeactivationReason.none
                        },
                        update: {
                            date: (_b = deactivationDate !== null && deactivationDate !== void 0 ? deactivationDate : subscription.paidUntil) !== null && _b !== void 0 ? _b : new Date(),
                            reason: deactivationReason !== null && deactivationReason !== void 0 ? deactivationReason : client_1.SubscriptionDeactivationReason.none
                        }
                    }
                }
            }
        });
    }
    /**
     * Function used to
     * @param memberPlanID
     * @param memberPlanSlug
     * @param paymentMethodID
     * @param paymentMethodSlug
     */
    async validateInputParamsCreateSubscription(memberPlanID, memberPlanSlug, paymentMethodID, paymentMethodSlug) {
        if ((memberPlanID == null && memberPlanSlug == null) ||
            (memberPlanID != null && memberPlanSlug != null)) {
            throw new error_1.UserInputError('You must provide either `memberPlanID` or `memberPlanSlug`.');
        }
        if ((paymentMethodID == null && paymentMethodSlug == null) ||
            (paymentMethodID != null && paymentMethodSlug != null)) {
            throw new error_1.UserInputError('You must provide either `paymentMethodID` or `paymentMethodSlug`.');
        }
    }
    async getMemberPlanByIDOrSlug(loaders, memberPlanSlug, memberPlanID) {
        const memberPlan = memberPlanID
            ? await loaders.activeMemberPlansByID.load(memberPlanID)
            : await loaders.activeMemberPlansBySlug.load(memberPlanSlug);
        if (!memberPlan)
            throw new error_1.NotFound('MemberPlan', memberPlanID || memberPlanSlug);
        return memberPlan;
    }
    async getPaymentMethodByIDOrSlug(loaders, paymentMethodSlug, paymentMethodID) {
        const paymentMethod = paymentMethodID
            ? await loaders.activePaymentMethodsByID.load(paymentMethodID)
            : await loaders.activePaymentMethodsBySlug.load(paymentMethodSlug);
        if (!paymentMethod)
            throw new error_1.NotFound('PaymentMethod', paymentMethodID || paymentMethodSlug);
        return paymentMethod;
    }
    async validateSubscriptionPaymentConfiguration(memberPlan, autoRenew, paymentPeriodicity, paymentMethod) {
        if (!memberPlan.availablePaymentMethods.some(apm => {
            if (apm.forceAutoRenewal && !autoRenew)
                return false;
            return (apm.paymentPeriodicities.includes(paymentPeriodicity) &&
                apm.paymentMethodIDs.includes(paymentMethod.id));
        }))
            throw new error_1.PaymentConfigurationNotAllowed();
    }
    async processSubscriptionProperties(subscriptionProperties) {
        return Array.isArray(subscriptionProperties)
            ? subscriptionProperties.map(property => {
                return {
                    public: true,
                    key: property.key,
                    value: property.value
                };
            })
            : [];
    }
    async createSubscription(subscriptionClient, userID, paymentMethod, paymentPeriodicity, monthlyAmount, memberPlan, properties, autoRenew) {
        const subscription = await subscriptionClient.create({
            data: {
                userID,
                startsAt: new Date(),
                modifiedAt: new Date(),
                paymentMethodID: paymentMethod.id,
                paymentPeriodicity,
                paidUntil: null,
                monthlyAmount,
                memberPlanID: memberPlan.id,
                properties: {
                    createMany: {
                        data: properties
                    }
                },
                autoRenew
            },
            include: {
                deactivation: true,
                periods: true,
                properties: true
            }
        });
        if (!subscription) {
            (0, server_1.logger)('mutation.public').error('Could not create new subscription for userID "%s"', userID);
            throw new error_1.InternalError();
        }
        return subscription;
    }
}
exports.MemberContext = MemberContext;
//# sourceMappingURL=memberContext.js.map