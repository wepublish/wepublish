"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WepublishServer = exports.logger = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const express_1 = __importDefault(require("express"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const context_1 = require("./context");
const events_1 = require("./events");
const schema_1 = require("./graphql/schema");
const jobs_1 = require("./jobs");
const mailProvider_1 = require("./mails/mailProvider");
const paymentProvider_1 = require("./payments/paymentProvider");
const utility_1 = require("./utility");
let serverLogger;
function logger(moduleName) {
    return serverLogger.child({ module: moduleName });
}
exports.logger = logger;
class WepublishServer {
    constructor(opts) {
        var _a, _b, _c, _d;
        this.opts = opts;
        const app = (0, express_1.default)();
        this.setupPrismaMiddlewares();
        serverLogger = opts.logger ? opts.logger : (0, pino_1.default)({ name: 'we.publish' });
        const adminServer = new apollo_server_express_1.ApolloServer({
            schema: schema_1.GraphQLWepublishSchema,
            playground: opts.playground ? { version: '1.7.27' } : false,
            introspection: (_a = opts.introspection) !== null && _a !== void 0 ? _a : false,
            tracing: (_b = opts.tracing) !== null && _b !== void 0 ? _b : false,
            context: ({ req }) => (0, context_1.contextFromRequest)(req, this.opts)
        });
        const publicServer = new apollo_server_express_1.ApolloServer({
            schema: schema_1.GraphQLWepublishPublicSchema,
            playground: opts.playground ? { version: '1.7.27' } : false,
            introspection: (_c = opts.introspection) !== null && _c !== void 0 ? _c : false,
            tracing: (_d = opts.tracing) !== null && _d !== void 0 ? _d : false,
            context: ({ req }) => (0, context_1.contextFromRequest)(req, this.opts)
        });
        const corsOptions = {
            origin: true,
            credentials: true,
            allowedHeaders: [
                'authorization',
                'content-type',
                'content-length',
                'accept',
                'origin',
                'user-agent'
            ],
            methods: ['POST', 'GET', 'OPTIONS']
        };
        app.use((0, pino_http_1.default)({
            logger: serverLogger,
            useLevel: 'debug'
        }));
        app.use(`/${mailProvider_1.MAIL_WEBHOOK_PATH_PREFIX}`, (0, mailProvider_1.setupMailProvider)(this.opts));
        app.use(`/${paymentProvider_1.PAYMENT_WEBHOOK_PATH_PREFIX}`, (0, paymentProvider_1.setupPaymentProvider)(this.opts));
        adminServer.applyMiddleware({
            app,
            path: '/admin',
            cors: corsOptions,
            bodyParserConfig: { limit: utility_1.MAX_PAYLOAD_SIZE }
        });
        publicServer.applyMiddleware({
            app,
            path: '/',
            cors: corsOptions
        });
        app.use((err, req, res, next) => {
            logger('server').error(err);
            if (err.status) {
                res.status(err.status);
                res.send({ error: err.message });
            }
            else {
                res.status(500).end();
            }
        });
        this.app = app;
    }
    async listen(port, hostname) {
        this.app.listen(port !== null && port !== void 0 ? port : 4000, hostname !== null && hostname !== void 0 ? hostname : 'localhost');
    }
    async runJob(command, data) {
        try {
            const context = await (0, context_1.contextFromRequest)(null, this.opts);
            await (0, jobs_1.runJob)(command, context, data);
            // FIXME: Will be refactored in WPC-604
            // Wait for all asynchronous events to finish. I know this is bad code.
            await new Promise(resolve => setTimeout(resolve, 10000));
        }
        catch (error) {
            logger('server').error(error, 'Error while running job "%s"', command);
        }
    }
    async setupPrismaMiddlewares() {
        this.opts.prisma.$use((0, events_1.onFindArticle)(this.opts.prisma));
        this.opts.prisma.$use((0, events_1.onFindPage)(this.opts.prisma));
        const contextWithoutReq = await (0, context_1.contextFromRequest)(null, this.opts);
        this.opts.prisma.$use((0, events_1.onInvoiceUpdate)(contextWithoutReq));
    }
}
exports.WepublishServer = WepublishServer;
//# sourceMappingURL=server.js.map