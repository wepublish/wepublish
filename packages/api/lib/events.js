"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInvoiceUpdate = exports.onFindPage = exports.onFindArticle = void 0;
const setting_1 = require("./db/setting");
const user_1 = require("./db/user");
const mailContext_1 = require("./mails/mailContext");
const server_1 = require("./server");
// @TODO: move into cron job
const onFindArticle = (prisma) => async (params, next) => {
    var _a, _b, _c, _d, _e, _f;
    if (!(params.model === 'Article' && params.action.startsWith('find'))) {
        return next(params);
    }
    // skip the call inside this middleware to not create an infinite loop
    if ((_f = (_e = (_d = (_c = (_b = (_a = params.args) === null || _a === void 0 ? void 0 : _a.where) === null || _b === void 0 ? void 0 : _b.pending) === null || _c === void 0 ? void 0 : _c.is) === null || _d === void 0 ? void 0 : _d.AND) === null || _e === void 0 ? void 0 : _e.publishAt) === null || _f === void 0 ? void 0 : _f.lte) {
        return next(params);
    }
    const articles = await prisma.article.findMany({
        where: {
            pending: {
                is: {
                    AND: {
                        publishAt: {
                            lte: new Date()
                        }
                    }
                }
            }
        },
        include: {
            pending: true,
            published: true
        }
    });
    await Promise.all(articles.map(async ({ id, publishedId, pending }) => {
        await prisma.article.update({
            where: {
                id
            },
            data: {
                published: {
                    connect: {
                        id: pending.id
                    }
                },
                pending: {
                    disconnect: true
                }
            }
        });
        await prisma.articleRevision.delete({
            where: {
                id: publishedId || undefined
            }
        });
    }));
    return next(params);
};
exports.onFindArticle = onFindArticle;
// @TODO: move into cron job
const onFindPage = (prisma) => async (params, next) => {
    var _a, _b, _c, _d, _e, _f;
    if (!(params.model === 'Page' && params.action.startsWith('find'))) {
        return next(params);
    }
    // skip the call inside this middleware to not create an infinite loop
    if ((_f = (_e = (_d = (_c = (_b = (_a = params.args) === null || _a === void 0 ? void 0 : _a.where) === null || _b === void 0 ? void 0 : _b.pending) === null || _c === void 0 ? void 0 : _c.is) === null || _d === void 0 ? void 0 : _d.AND) === null || _e === void 0 ? void 0 : _e.publishAt) === null || _f === void 0 ? void 0 : _f.lte) {
        return next(params);
    }
    const pages = await prisma.page.findMany({
        where: {
            pending: {
                is: {
                    AND: {
                        publishAt: {
                            lte: new Date()
                        }
                    }
                }
            }
        },
        include: {
            pending: true,
            published: true
        }
    });
    await Promise.all(pages.map(async ({ id, publishedId, pending }) => {
        await prisma.page.update({
            where: {
                id
            },
            data: {
                published: {
                    connect: {
                        id: pending.id
                    }
                },
                pending: {
                    disconnect: true
                }
            }
        });
        await prisma.pageRevision.delete({
            where: {
                id: publishedId || undefined
            }
        });
    }));
    return next(params);
};
exports.onFindPage = onFindPage;
/**
 * This event listener is used after invoice has been marked as paid. The following logic is responsible to
 * update the subscription periode, eventually create a permanent user out of the temp user and sending mails
 * to the user.
 */
const onInvoiceUpdate = (context) => async (params, next) => {
    var _a, _b;
    if (params.model !== 'Invoice') {
        return next(params);
    }
    if (params.action !== 'update') {
        return next(params);
    }
    const model = await next(params);
    // only activate subscription, if invoice has a paidAt and subscriptionID.
    if (!model.paidAt || !model.subscriptionID) {
        return model;
    }
    let mailTypeToSend = mailContext_1.SendMailType.NewMemberSubscription;
    let subscription = await context.prisma.subscription.findUnique({
        where: {
            id: model.subscriptionID
        },
        include: {
            deactivation: true,
            periods: true,
            properties: true
        }
    });
    if (!subscription) {
        return model;
    }
    const { periods } = subscription;
    const period = periods.find((period) => period.invoiceID === model.id);
    if (!period) {
        (0, server_1.logger)('events').warn(`No period found for subscription with ID ${subscription.id}.`);
        return model;
    }
    // remove eventual deactivation object from subscription (in case the subscription has been auto-deactivated but the
    // respective invoice was paid later on). Also update the paidUntil field of the subscription
    if (subscription.paidUntil === null || period.endsAt > subscription.paidUntil) {
        subscription = await context.prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                paidUntil: period.endsAt,
                deactivation: {
                    delete: Boolean(subscription.deactivation)
                }
            },
            include: {
                deactivation: true,
                periods: true,
                properties: true
            }
        });
        if (!subscription) {
            (0, server_1.logger)('events').warn(`Could not update Subscription.`);
            return model;
        }
        // in case of multiple periods we need to send a renewal member subscription instead of the default new member subscription mail
        if (periods.length > 1) {
            mailTypeToSend = mailContext_1.SendMailType.RenewedMemberSubscription;
        }
        // send mails including login link
        const jwtSetting = await context.prisma.setting.findUnique({
            where: { name: setting_1.SettingName.SEND_LOGIN_JWT_EXPIRES_MIN }
        });
        const jwtExpires = (_a = jwtSetting === null || jwtSetting === void 0 ? void 0 : jwtSetting.value) !== null && _a !== void 0 ? _a : parseInt((_b = process.env.SEND_LOGIN_JWT_EXPIRES_MIN) !== null && _b !== void 0 ? _b : '');
        if (!jwtExpires) {
            throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');
        }
        const user = await context.prisma.user.findUnique({
            where: {
                id: subscription.userID
            },
            select: user_1.unselectPassword
        });
        if (!user) {
            (0, server_1.logger)('events').warn(`User not found %s`, subscription.userID);
            return model;
        }
        const token = context.generateJWT({
            id: user.id,
            expiresInMinutes: jwtExpires
        });
        await context.mailContext.sendMail({
            type: mailTypeToSend,
            recipient: user.email,
            data: {
                url: context.urlAdapter.getLoginURL(token),
                user,
                subscription
            }
        });
    }
    return model;
};
exports.onInvoiceUpdate = onInvoiceUpdate;
//# sourceMappingURL=events.js.map