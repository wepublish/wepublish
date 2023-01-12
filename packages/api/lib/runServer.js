"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runServer = void 0;
const client_1 = require("@prisma/client");
const body_parser_1 = __importDefault(require("body-parser"));
const path_1 = __importDefault(require("path"));
const pino_multi_stream_1 = __importDefault(require("pino-multi-stream"));
const pino_sentry_1 = require("pino-sentry");
const pino_stackdriver_1 = __importDefault(require("pino-stackdriver"));
const process = __importStar(require("process"));
const url_1 = require("url");
const yargs_1 = __importDefault(require("yargs"));
// @ts-ignore
const helpers_1 = require("yargs/helpers");
const algebraicCaptchaChallenge_1 = require("./challenges/algebraicCaptchaChallenge");
const server_1 = require("./server");
const mailContext_1 = require("./mails/mailContext");
const jobs_1 = require("./jobs");
const stripePaymentProvider_1 = require("./payments/stripePaymentProvider");
const stripeCheckoutPaymentProvider_1 = require("./payments/stripeCheckoutPaymentProvider");
const MailgunMailProvider_1 = require("./mails/MailgunMailProvider");
const payrexxPaymentProvider_1 = require("./payments/payrexxPaymentProvider");
const karmaMediaAdapter_1 = require("./media/karmaMediaAdapter");
class WepublishURLAdapter {
    constructor(props) {
        this.websiteURL = props.websiteURL;
    }
    getPublicArticleURL(article) {
        if (article.canonicalUrl) {
            return article.canonicalUrl;
        }
        return `${this.websiteURL}/a/${article.id}/${article.slug}`;
    }
    getPeeredArticleURL(peer, article) {
        return `${this.websiteURL}/p/${peer.id}/${article.id}`;
    }
    getPublicPageURL(page) {
        return `${this.websiteURL}/page/${page.id}/${page.slug}`;
    }
    getAuthorURL(author) {
        return `${this.websiteURL}/author/${author.slug || author.id}`;
    }
    getCommentURL(item, comment) {
        if (comment.itemType === client_1.CommentItemType.article) {
            return `${this.websiteURL}/a/${item.id}/${item.slug}#${comment.id}`;
        }
        return `${this.websiteURL}/${item.slug}#${comment.id}`;
    }
    getArticlePreviewURL(token) {
        return `${this.websiteURL}/a/preview/${token}`;
    }
    getPagePreviewURL(token) {
        return `${this.websiteURL}/${token}`;
    }
    getLoginURL(token) {
        return `${this.websiteURL}/login?jwt=${token}`;
    }
}
async function runServer() {
    var _a, _b, _c;
    if (!process.env.DATABASE_URL)
        throw new Error('No DATABASE_URL defined in environment.');
    if (!process.env.HOST_URL)
        throw new Error('No HOST_URL defined in environment.');
    if (!process.env.WEBSITE_URL)
        throw new Error('No WEBSITE_URL defined in environment.');
    const hostURL = process.env.HOST_URL;
    const websiteURL = process.env.WEBSITE_URL;
    const port = process.env.PORT ? parseInt(process.env.PORT) : undefined;
    const address = process.env.ADDRESS ? process.env.ADDRESS : 'localhost';
    if (!process.env.MEDIA_SERVER_URL) {
        throw new Error('No MEDIA_SERVER_URL defined in environment.');
    }
    if (!process.env.MEDIA_SERVER_TOKEN) {
        throw new Error('No MEDIA_SERVER_TOKEN defined in environment.');
    }
    const mediaAdapter = new karmaMediaAdapter_1.KarmaMediaAdapter(new url_1.URL(process.env.MEDIA_SERVER_URL), process.env.MEDIA_SERVER_TOKEN, process.env.MEDIA_SERVER_INTERNAL_URL
        ? new url_1.URL(process.env.MEDIA_SERVER_INTERNAL_URL)
        : undefined);
    const prisma = new client_1.PrismaClient();
    await prisma.$connect();
    const oauth2Providers = [];
    if (process.env.OAUTH_GOOGLE_DISCOVERY_URL &&
        process.env.OAUTH_GOOGLE_CLIENT_ID &&
        process.env.OAUTH_GOOGLE_CLIENT_KEY &&
        process.env.OAUTH_GOOGLE_REDIRECT_URL) {
        oauth2Providers.push({
            name: 'google',
            discoverUrl: process.env.OAUTH_GOOGLE_DISCOVERY_URL,
            clientId: process.env.OAUTH_GOOGLE_CLIENT_ID,
            clientKey: process.env.OAUTH_GOOGLE_CLIENT_KEY,
            redirectUri: [process.env.OAUTH_GOOGLE_REDIRECT_URL],
            scopes: ['openid profile email']
        });
    }
    let mailProvider;
    if (process.env.MAILGUN_API_KEY &&
        process.env.MAILGUN_BASE_DOMAIN &&
        process.env.MAILGUN_MAIL_DOMAIN &&
        process.env.MAILGUN_WEBHOOK_SECRET) {
        mailProvider = new MailgunMailProvider_1.MailgunMailProvider({
            id: 'mailgun',
            name: 'Mailgun',
            fromAddress: 'dev@wepublish.ch',
            webhookEndpointSecret: process.env.MAILGUN_WEBHOOK_SECRET,
            baseDomain: process.env.MAILGUN_BASE_DOMAIN,
            mailDomain: process.env.MAILGUN_MAIL_DOMAIN,
            apiKey: process.env.MAILGUN_API_KEY,
            incomingRequestHandler: body_parser_1.default.json()
        });
    }
    // left here intentionally for testing
    /* if (process.env.MAILCHIMP_API_KEY && process.env.MAILCHIMP_WEBHOOK_SECRET) {
        mailProvider = new MailchimpMailProvider({
          id: 'mailchimp',
          name: 'Mailchimp',
          fromAddress: 'dev@wepublish.ch',
          webhookEndpointSecret: process.env.MAILCHIMP_WEBHOOK_SECRET,
          apiKey: process.env.MAILCHIMP_API_KEY,
          baseURL: '',
          incomingRequestHandler: bodyParser.urlencoded({extended: true})
        })
      } */
    const paymentProviders = [];
    if (process.env.STRIPE_SECRET_KEY &&
        process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET &&
        process.env.STRIPE_WEBHOOK_SECRET) {
        paymentProviders.push(new stripeCheckoutPaymentProvider_1.StripeCheckoutPaymentProvider({
            id: 'stripe_checkout',
            name: 'Stripe Checkout',
            offSessionPayments: false,
            secretKey: process.env.STRIPE_SECRET_KEY,
            webhookEndpointSecret: process.env.STRIPE_CHECKOUT_WEBHOOK_SECRET,
            incomingRequestHandler: body_parser_1.default.raw({ type: 'application/json' })
        }), new stripePaymentProvider_1.StripePaymentProvider({
            id: 'stripe',
            name: 'Stripe',
            offSessionPayments: true,
            secretKey: process.env.STRIPE_SECRET_KEY,
            webhookEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
            incomingRequestHandler: body_parser_1.default.raw({ type: 'application/json' })
        }));
    }
    if (process.env.PAYREXX_INSTANCE_NAME && process.env.PAYREXX_API_SECRET) {
        paymentProviders.push(new payrexxPaymentProvider_1.PayrexxPaymentProvider({
            id: 'payrexx',
            name: 'Payrexx',
            offSessionPayments: false,
            instanceName: process.env.PAYREXX_INSTANCE_NAME,
            instanceAPISecret: process.env.PAYREXX_API_SECRET,
            psp: [0, 15, 17, 2, 3, 36],
            pm: [
                'postfinance_card',
                'postfinance_efinance',
                // "mastercard",
                // "visa",
                'twint',
                // "invoice",
                'paypal'
            ],
            vatRate: 7.7,
            incomingRequestHandler: body_parser_1.default.json()
        }));
    }
    const prettyStream = pino_multi_stream_1.default.prettyStream();
    const streams = [{ stream: prettyStream }];
    if (process.env.GOOGLE_PROJECT) {
        streams.push({
            level: 'info',
            stream: pino_stackdriver_1.default.createWriteStream({
                projectId: process.env.GOOGLE_PROJECT,
                logName: 'wepublish_api'
            })
        });
    }
    if (process.env.SENTRY_DSN) {
        streams.push({
            level: 'error',
            stream: (0, pino_sentry_1.createWriteStream)({
                dsn: process.env.SENTRY_DSN,
                environment: (_a = process.env.SENTRY_ENV) !== null && _a !== void 0 ? _a : 'dev'
            })
        });
    }
    const logger = (0, pino_multi_stream_1.default)({
        streams,
        level: 'debug'
    });
    const challenge = new algebraicCaptchaChallenge_1.AlgebraicCaptchaChallenge('changeMe', 600, {
        width: 200,
        height: 200,
        background: '#ffffff',
        noise: 5,
        minValue: 1,
        maxValue: 10,
        operandAmount: 1,
        operandTypes: ['+', '-'],
        mode: 'formula',
        targetSymbol: '?'
    });
    const server = new server_1.WepublishServer({
        hostURL,
        websiteURL,
        mediaAdapter,
        prisma,
        oauth2Providers,
        mailProvider,
        mailContextOptions: {
            defaultFromAddress: (_b = process.env.DEFAULT_FROM_ADDRESS) !== null && _b !== void 0 ? _b : 'dev@wepublish.ch',
            defaultReplyToAddress: (_c = process.env.DEFAULT_REPLY_TO_ADDRESS) !== null && _c !== void 0 ? _c : 'reply-to@wepublish.ch',
            mailTemplateMaps: [
                {
                    type: mailContext_1.SendMailType.LoginLink,
                    localTemplate: 'loginLink',
                    local: true,
                    subject: 'Welcome new Member' // only needed if remoteTemplate
                },
                {
                    type: mailContext_1.SendMailType.TestMail,
                    localTemplate: 'testMail',
                    local: true
                },
                {
                    type: mailContext_1.SendMailType.PasswordReset,
                    localTemplate: 'passwordReset',
                    local: true
                },
                {
                    type: mailContext_1.SendMailType.NewMemberSubscription,
                    localTemplate: 'newMemberSubscription',
                    local: true
                },
                {
                    type: mailContext_1.SendMailType.RenewedMemberSubscription,
                    localTemplate: 'renewedMemberSubscription',
                    local: true
                },
                {
                    type: mailContext_1.SendMailType.MemberSubscriptionOffSessionBefore,
                    localTemplate: 'memberSubscriptionPayment/offSessionPaymentOneWeekBefore',
                    local: true
                },
                {
                    type: mailContext_1.SendMailType.MemberSubscriptionOnSessionBefore,
                    localTemplate: 'memberSubscriptionPayment/onSessionBefore',
                    local: true
                },
                {
                    type: mailContext_1.SendMailType.MemberSubscriptionOnSessionAfter,
                    localTemplate: 'memberSubscriptionPayment/onSessionAfter',
                    local: true
                },
                {
                    type: mailContext_1.SendMailType.MemberSubscriptionOffSessionFailed,
                    localTemplate: 'memberSubscriptionPayment/offSessionPaymentFailed',
                    local: true
                }
            ],
            mailTemplatesPath: path_1.default.resolve('templates', 'emails')
        },
        paymentProviders,
        urlAdapter: new WepublishURLAdapter({ websiteURL }),
        playground: true,
        introspection: true,
        tracing: true,
        logger,
        challenge
    });
    // eslint-disable-next-line no-unused-expressions
    (0, yargs_1.default)((0, helpers_1.hideBin)(process.argv))
        .command(['listen', '$0'], 'start the server', () => {
        /* do nothing */
    }, async (argv) => {
        await server.listen(port, address);
    })
        .command('dmr', 'Renew Memberships', () => {
        /* do nothing */
    }, async (argv) => {
        await server.runJob(jobs_1.JobType.DailyMembershipRenewal, {
            startDate: new Date()
        });
        process.exit(0);
    })
        .command('dir', 'Remind open invoices', () => {
        /* do nothing */
    }, async () => {
        var _a;
        await server.runJob(jobs_1.JobType.DailyInvoiceReminder, {
            userPaymentURL: `${websiteURL}/user/invocies`,
            replyToAddress: (_a = process.env.DEFAULT_REPLY_TO_ADDRESS) !== null && _a !== void 0 ? _a : 'reply-to@wepublish.ch',
            sendEveryDays: 3
        });
        process.exit(0);
    })
        .command('dic', 'charge open invoices', () => {
        /* do nothing */
    }, async () => {
        await server.runJob(jobs_1.JobType.DailyInvoiceCharger, {});
        process.exit(0);
    })
        .command('checkdic', 'check open invoices', () => {
        /* do nothing */
    }, async () => {
        await server.runJob(jobs_1.JobType.DailyInvoiceChecker, {});
        process.exit(0);
    }).argv;
}
exports.runServer = runServer;
//# sourceMappingURL=runServer.js.map