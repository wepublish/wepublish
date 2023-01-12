"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Oauth2Server = void 0;
const client_1 = require("@prisma/client");
const api_1 = require("@wepublish/api");
const express_1 = __importDefault(require("express"));
const set_1 = __importDefault(require("lodash/set"));
const oidc_provider_1 = require("oidc-provider");
const path_1 = __importDefault(require("path"));
const pino_1 = __importDefault(require("pino"));
const pino_http_1 = __importDefault(require("pino-http"));
const url_1 = __importDefault(require("url"));
const adapter_1 = require("./adapter");
const configuration_1 = require("./configuration");
const routes_1 = require("./routes");
let serverLogger;
const ONE_DAY_IN_MS = 1 * 24 * 60 * 60 * 1000;
class Oauth2Server {
    constructor(opts) {
        const app = (0, express_1.default)();
        this.opts = opts;
        this.prisma = new client_1.PrismaClient();
        this.prisma.$connect();
        serverLogger = opts.logger ? opts.logger : (0, pino_1.default)({ name: 'oauth2' });
        /* const corsOptions = {
          origin: '*',
          allowedHeaders: [
            'authorization',
            'content-type',
            'content-length',
            'accept',
            'origin',
            'user-agent'
          ],
          methods: ['POST', 'GET', 'OPTIONS']
        } */
        app.use((0, pino_http_1.default)({
            logger: serverLogger,
            useLevel: 'debug'
        }));
        app.use((err, req, res, next) => {
            (0, api_1.logger)('server').error(err);
            return next(err);
        });
        if (opts.viewPath) {
            app.set('views', opts.viewPath);
        }
        else {
            app.set('views', path_1.default.join(__dirname, '..', 'views'));
        }
        app.set('view engine', 'ejs');
        this.app = app;
    }
    async findAccount(ctx, id) {
        const user = await this.prisma.user.findUnique({
            where: { id }
        });
        if (user) {
            return {
                accountId: user.id,
                email: user.email,
                async claims(use, scope) {
                    console.log('claims', use, scope);
                    return { sub: user.email, email: user.email };
                }
            };
        }
        else {
            throw new Error('did not find user');
        }
    }
    async listen(port, hostname) {
        await adapter_1.MongoDBAdapter.initialize(this.opts.mongoUrlOauth2, 'en');
        await adapter_1.MongoDBAdapter.connect(this.opts.mongoUrlOauth2);
        const config = Object.assign({ adapter: adapter_1.MongoDBAdapter, clients: [
                {
                    client_id: this.opts.clientID,
                    client_secret: this.opts.clientSecret,
                    grant_types: this.opts.grantTypes,
                    redirect_uris: this.opts.redirectUris
                }
            ], cookies: {
                long: { signed: true, maxAge: ONE_DAY_IN_MS },
                short: { signed: true },
                keys: this.opts.cookieKeys
            }, jwks: {
                keys: this.opts.jwksKeys
            }, findAccount: this.findAccount.bind(this) }, configuration_1.configuration);
        const provider = new oidc_provider_1.Provider(this.opts.issuer, config);
        if (process.env.NODE_ENV === 'production') {
            this.app.enable('trust proxy');
            provider.proxy = true;
            (0, set_1.default)(configuration_1.configuration, 'cookies.short.secure', true);
            (0, set_1.default)(configuration_1.configuration, 'cookies.long.secure', true);
            this.app.use((req, res, next) => {
                if (req.secure) {
                    next();
                }
                else if (req.method === 'GET' || req.method === 'HEAD') {
                    res.redirect(url_1.default.format({
                        protocol: 'https',
                        host: req.get('host'),
                        pathname: req.originalUrl
                    }));
                }
                else {
                    res.status(400).json({
                        error: 'invalid_request',
                        error_description: 'do yourself a favor and only use https'
                    });
                }
            });
        }
        (0, routes_1.routes)(this.app, provider, this.prisma);
        this.app.use(provider.callback);
        console.log('views_path', path_1.default.join(__dirname, 'views'));
        this.app.listen(port !== null && port !== void 0 ? port : 4200, hostname !== null && hostname !== void 0 ? hostname : 'localhost');
    }
}
exports.Oauth2Server = Oauth2Server;
//# sourceMappingURL=server.js.map