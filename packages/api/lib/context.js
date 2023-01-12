"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFetcher = exports.tokenFromRequest = exports.contextFromRequest = void 0;
const client_1 = require("@prisma/client");
const abort_controller_1 = __importDefault(require("abort-controller"));
const apollo_server_express_1 = require("apollo-server-express");
const crypto_1 = __importDefault(require("crypto"));
const dataloader_1 = __importDefault(require("dataloader"));
const graphql_1 = require("graphql");
const graphql_tools_1 = require("graphql-tools");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const node_cache_1 = __importDefault(require("node-cache"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const openid_client_1 = require("openid-client");
const url_1 = __importDefault(require("url"));
const common_1 = require("./db/common");
const session_1 = require("./db/session");
const setting_1 = require("./db/setting");
const user_1 = require("./db/user");
const error_1 = require("./error");
const poll_public_queries_1 = require("./graphql/poll/poll.public-queries");
const mailContext_1 = require("./mails/mailContext");
const memberContext_1 = require("./memberContext");
const server_1 = require("./server");
/**
 * Peered article cache configuration and setup
 */
const ONE_DAY_IN_MS = 24 * 60 * 60 * 1000;
const fetcherCache = new node_cache_1.default({
    stdTTL: 1800,
    checkperiod: 60,
    deleteOnExpire: false,
    useClones: false
});
fetcherCache.on('expired', async function (key, value) {
    // Refresh cache only if last use of cached entry is less than 24h ago
    if (value.queryParams.lastQueried > new Date().getTime() - ONE_DAY_IN_MS) {
        await loadFreshData(value.queryParams);
    }
    else {
        fetcherCache.del(key);
    }
});
const createOptionalsArray = (keys, data, attribute) => {
    const dataMap = Object.fromEntries(data.map(entry => [entry[attribute], entry]));
    return keys.map(id => { var _a; return (_a = dataMap[id]) !== null && _a !== void 0 ? _a : null; });
};
const getSessionByToken = async (token, sessionClient, tokenClient, userClient, userRoleClient) => {
    const [tokenMatch, session] = await Promise.all([
        tokenClient.findFirst({
            where: {
                token
            }
        }),
        sessionClient.findFirst({
            where: {
                token
            }
        })
    ]);
    if (tokenMatch) {
        return {
            type: session_1.SessionType.Token,
            id: tokenMatch.id,
            name: tokenMatch.name,
            token: tokenMatch.token,
            roles: await userRoleClient.findMany({
                where: {
                    id: {
                        in: tokenMatch.roleIDs
                    }
                }
            })
        };
    }
    else if (session) {
        const user = await userClient.findUnique({
            where: {
                id: session.userID
            },
            select: user_1.unselectPassword
        });
        if (!user)
            return null;
        return {
            type: session_1.SessionType.User,
            id: session.id,
            token: session.token,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            user,
            roles: await userRoleClient.findMany({
                where: {
                    id: {
                        in: user.roleIDs
                    }
                }
            })
        };
    }
    return null;
};
async function contextFromRequest(req, { hostURL, websiteURL, prisma, mediaAdapter, urlAdapter, oauth2Providers, hooks, mailProvider, mailContextOptions, paymentProviders, challenge, sessionTTL, hashCostFactor }) {
    const token = tokenFromRequest(req);
    const session = token
        ? await getSessionByToken(token, prisma.session, prisma.token, prisma.user, prisma.userRole)
        : null;
    const isSessionValid = session
        ? session.type === session_1.SessionType.User
            ? session.expiresAt > new Date()
            : true
        : false;
    const peerDataLoader = new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.peer.findMany({
        where: {
            id: {
                in: ids
            }
        }
    }), 'id'));
    const loaders = {
        navigationByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.navigation.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
                links: true
            }
        }), 'id')),
        navigationByKey: new dataloader_1.default(async (keys) => createOptionalsArray(keys, await prisma.navigation.findMany({
            where: {
                key: {
                    in: keys
                }
            },
            include: {
                links: true
            }
        }), 'key')),
        authorsByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.author.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
                links: true
            }
        }), 'id')),
        authorsBySlug: new dataloader_1.default(async (slugs) => createOptionalsArray(slugs, await prisma.author.findMany({
            where: {
                slug: {
                    in: slugs
                }
            },
            include: {
                links: true
            }
        }), 'slug')),
        images: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.image.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
                focalPoint: true
            }
        }), 'id')),
        articles: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.article.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
                draft: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                },
                pending: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                },
                published: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                }
            }
        }), 'id')),
        publicArticles: new dataloader_1.default(async (ids) => createOptionalsArray(ids, (await prisma.article.findMany({
            where: {
                id: {
                    in: ids
                },
                OR: [
                    {
                        publishedId: {
                            not: null
                        }
                    },
                    {
                        pendingId: {
                            not: null
                        }
                    }
                ]
            },
            include: {
                published: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                },
                pending: {
                    include: {
                        properties: true,
                        authors: true,
                        socialMediaAuthors: true
                    }
                }
            }
        })).map(({ id, shared, published, pending }) => (Object.assign(Object.assign({ shared }, (published || pending)), { id }))), 'id')),
        pages: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.page.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
                draft: {
                    include: {
                        properties: true
                    }
                },
                pending: {
                    include: {
                        properties: true
                    }
                },
                published: {
                    include: {
                        properties: true
                    }
                }
            }
        }), 'id')),
        publicPagesByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, (await prisma.page.findMany({
            where: {
                id: {
                    in: ids
                },
                OR: [
                    {
                        published: {
                            isNot: null
                        }
                    },
                    {
                        pending: {
                            isNot: null
                        }
                    }
                ]
            },
            include: {
                published: {
                    include: {
                        properties: true
                    }
                },
                pending: {
                    include: {
                        properties: true
                    }
                }
            }
        })).map(({ id, published, pending }) => (Object.assign(Object.assign({}, (published || pending)), { id }))), 'id')),
        publicPagesBySlug: new dataloader_1.default(async (slugs) => createOptionalsArray(slugs, (await prisma.page.findMany({
            where: {
                OR: [
                    {
                        published: {
                            is: {
                                slug: {
                                    in: slugs
                                }
                            }
                        }
                    },
                    {
                        pending: {
                            is: {
                                slug: {
                                    in: slugs
                                }
                            }
                        }
                    }
                ]
            },
            include: {
                published: {
                    include: {
                        properties: true
                    }
                },
                pending: {
                    include: {
                        properties: true
                    }
                }
            }
        })).map(({ id, published, pending }) => (Object.assign(Object.assign({}, (published || pending)), { id }))), 'slug')),
        userRolesByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.userRole.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        }), 'id')),
        mailLogsByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.mailLog.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        }), 'id')),
        peer: peerDataLoader,
        peerBySlug: new dataloader_1.default(async (slugs) => createOptionalsArray(slugs, await prisma.peer.findMany({
            where: {
                slug: {
                    in: slugs
                }
            }
        }), 'slug')),
        peerSchema: new dataloader_1.default(async (ids) => {
            const peers = await peerDataLoader.loadMany(ids);
            return Promise.all(peers.map(async (peer) => {
                var _a;
                try {
                    if (!peer)
                        return null;
                    if (peer instanceof Error) {
                        console.error(peer);
                        return null;
                    }
                    const peerTimeout = ((_a = (await prisma.setting.findUnique({
                        where: { name: setting_1.SettingName.PEERING_TIMEOUT_MS }
                    }))) === null || _a === void 0 ? void 0 : _a.value) ||
                        parseInt(process.env.PEERING_TIMEOUT_IN_MS) ||
                        3000;
                    const fetcher = createFetcher(peer.hostURL, peer.token, peerTimeout);
                    return (0, graphql_tools_1.makeRemoteExecutableSchema)({
                        schema: await (0, graphql_tools_1.introspectSchema)(fetcher),
                        fetcher
                    });
                }
                catch (err) {
                    console.error(err);
                    return null;
                }
            }));
        }),
        peerAdminSchema: new dataloader_1.default(async (ids) => {
            const peers = await peerDataLoader.loadMany(ids);
            return Promise.all(peers.map(async (peer) => {
                var _a;
                try {
                    if (!peer)
                        return null;
                    if (peer instanceof Error) {
                        console.error(peer);
                        return null;
                    }
                    const peerTimeout = ((_a = (await prisma.setting.findUnique({
                        where: { name: setting_1.SettingName.PEERING_TIMEOUT_MS }
                    }))) === null || _a === void 0 ? void 0 : _a.value) ||
                        parseInt(process.env.PEERING_TIMEOUT_IN_MS) ||
                        3000;
                    const fetcher = createFetcher(url_1.default.resolve(peer.hostURL, 'admin'), peer.token, peerTimeout);
                    return (0, graphql_tools_1.makeRemoteExecutableSchema)({
                        schema: await (0, graphql_tools_1.introspectSchema)(fetcher),
                        fetcher
                    });
                }
                catch (err) {
                    console.error(err);
                    return null;
                }
            }));
        }),
        memberPlansByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.memberPlan.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
                availablePaymentMethods: true
            }
        }), 'id')),
        memberPlansBySlug: new dataloader_1.default(async (slugs) => createOptionalsArray(slugs, await prisma.memberPlan.findMany({
            where: {
                slug: {
                    in: slugs
                }
            },
            include: {
                availablePaymentMethods: true
            }
        }), 'slug')),
        activeMemberPlansByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.memberPlan.findMany({
            where: {
                id: {
                    in: ids
                },
                active: true
            },
            include: {
                availablePaymentMethods: true
            }
        }), 'id')),
        activeMemberPlansBySlug: new dataloader_1.default(async (slugs) => createOptionalsArray(slugs, await prisma.memberPlan.findMany({
            where: {
                slug: {
                    in: slugs
                },
                active: true
            },
            include: {
                availablePaymentMethods: true
            }
        }), 'slug')),
        paymentMethodsByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.paymentMethod.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        }), 'id')),
        activePaymentMethodsByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.paymentMethod.findMany({
            where: {
                id: {
                    in: ids
                },
                active: true
            }
        }), 'id')),
        activePaymentMethodsBySlug: new dataloader_1.default(async (slugs) => createOptionalsArray(slugs, await prisma.paymentMethod.findMany({
            where: {
                slug: {
                    in: slugs
                },
                active: true
            }
        }), 'slug')),
        invoicesByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.invoice.findMany({
            where: {
                id: {
                    in: ids
                }
            },
            include: {
                items: true
            }
        }), 'id')),
        paymentsByID: new dataloader_1.default(async (ids) => createOptionalsArray(ids, await prisma.payment.findMany({
            where: {
                id: {
                    in: ids
                }
            }
        }), 'id')),
        pollById: new dataloader_1.default(async (ids) => Promise.all(ids.map(id => (0, poll_public_queries_1.getPoll)(id, prisma.poll))))
    };
    const mailContext = new mailContext_1.MailContext({
        prisma,
        mailProvider,
        defaultFromAddress: mailContextOptions.defaultFromAddress,
        defaultReplyToAddress: mailContextOptions.defaultReplyToAddress,
        mailTemplateMaps: mailContextOptions.mailTemplateMaps,
        mailTemplatesPath: mailContextOptions.mailTemplatesPath
    });
    const generateJWT = (props) => {
        var _a;
        if (!process.env.JWT_SECRET_KEY)
            throw new Error('No JWT_SECRET_KEY defined in environment.');
        const jwtOptions = {
            issuer: hostURL,
            audience: (_a = props.audience) !== null && _a !== void 0 ? _a : websiteURL,
            algorithm: 'HS256',
            expiresIn: `${props.expiresInMinutes || 15}m`
        };
        return jsonwebtoken_1.default.sign({ sub: props.id }, process.env.JWT_SECRET_KEY, jwtOptions);
    };
    const verifyJWT = (token) => {
        if (!process.env.JWT_SECRET_KEY)
            throw new Error('No JWT_SECRET_KEY defined in environment.');
        const ver = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        return typeof ver === 'object' && 'sub' in ver ? ver.sub : '';
    };
    const memberContext = new memberContext_1.MemberContext({
        loaders,
        prisma,
        paymentProviders,
        mailContext,
        getLoginUrlForUser(user) {
            const jwt = generateJWT({
                id: user.id,
                expiresInMinutes: 10080 // One week in minutes
            });
            return urlAdapter.getLoginURL(jwt);
        }
    });
    return {
        hostURL,
        websiteURL,
        session: isSessionValid ? session : null,
        loaders,
        prisma,
        memberContext,
        mailContext,
        mediaAdapter,
        urlAdapter,
        oauth2Providers,
        paymentProviders,
        hooks,
        sessionTTL: sessionTTL !== null && sessionTTL !== void 0 ? sessionTTL : common_1.DefaultSessionTTL,
        hashCostFactor: hashCostFactor !== null && hashCostFactor !== void 0 ? hashCostFactor : common_1.DefaultBcryptHashCostFactor,
        async getOauth2Clients() {
            return await Promise.all(oauth2Providers.map(async (provider) => {
                const issuer = await openid_client_1.Issuer.discover(provider.discoverUrl);
                return {
                    name: provider.name,
                    provider,
                    client: new issuer.Client({
                        client_id: provider.clientId,
                        client_secret: provider.clientKey,
                        redirect_uris: provider.redirectUri,
                        response_types: ['code']
                    })
                };
            }));
        },
        authenticateUser() {
            if (!session || session.type !== session_1.SessionType.User) {
                throw new apollo_server_express_1.AuthenticationError('Invalid user session!');
            }
            if (!isSessionValid) {
                throw new error_1.TokenExpiredError();
            }
            return session;
        },
        optionalAuthenticateUser() {
            if (!session || session.type !== session_1.SessionType.User || !isSessionValid) {
                return null;
            }
            return session;
        },
        authenticateToken() {
            if (!session || session.type !== session_1.SessionType.Token) {
                throw new apollo_server_express_1.AuthenticationError('Invalid token session!');
            }
            return session;
        },
        authenticate() {
            if (!session) {
                throw new apollo_server_express_1.AuthenticationError('Invalid session!');
            }
            if (!isSessionValid) {
                throw new error_1.TokenExpiredError();
            }
            return session;
        },
        generateJWT,
        verifyJWT,
        async createPaymentWithProvider({ paymentMethodID, invoice, saveCustomer, failureURL, successURL }) {
            const paymentMethod = await loaders.activePaymentMethodsByID.load(paymentMethodID);
            const paymentProvider = paymentProviders.find(pp => pp.id === (paymentMethod === null || paymentMethod === void 0 ? void 0 : paymentMethod.paymentProviderID));
            if (!paymentProvider) {
                throw new Error('paymentProvider not found');
            }
            const payment = await prisma.payment.create({
                data: {
                    paymentMethodID,
                    invoiceID: invoice.id,
                    state: client_1.PaymentState.created
                }
            });
            const intent = await paymentProvider.createIntent({
                paymentID: payment.id,
                invoice,
                saveCustomer,
                successURL,
                failureURL
            });
            const updatedPayment = await prisma.payment.update({
                where: { id: payment.id },
                data: {
                    state: intent.state,
                    intentID: `${intent.intentID}`,
                    intentData: intent.intentData,
                    intentSecret: intent.intentSecret,
                    paymentData: intent.paymentData,
                    paymentMethodID: payment.paymentMethodID,
                    invoiceID: payment.invoiceID
                }
            });
            if (!updatedPayment)
                throw new Error('Error during updating payment'); // TODO: this check needs to be removed
            return updatedPayment;
        },
        challenge
    };
}
exports.contextFromRequest = contextFromRequest;
function tokenFromRequest(req) {
    if (req === null || req === void 0 ? void 0 : req.headers.authorization) {
        const [, token] = req.headers.authorization.match(/Bearer (.+?$)/i) || [];
        return token || null;
    }
    return null;
}
exports.tokenFromRequest = tokenFromRequest;
/**
 * Function that generate the key for the cache
 * @param params
 */
function generateCacheKey(params) {
    return (crypto_1.default
        // Hash function doesn't have to be crypto safe, just fast!
        .createHash('md5')
        .update(`${JSON.stringify(params.hostURL)}${JSON.stringify(params.variables)}${JSON.stringify(params.query)}`)
        .digest('hex'));
}
/**
 * Function that refreshes and initializes entries in the cache
 * @param params
 */
async function loadFreshData(params) {
    try {
        const abortController = new abort_controller_1.default();
        const peerTimeOUT = params.timeout ? params.timeout : 3000;
        // Since we use auto refresh cache we can safely set the timeout to 3sec
        setTimeout(() => abortController.abort(), peerTimeOUT);
        const fetchResult = await (0, node_fetch_1.default)(params.hostURL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${params.token}` },
            body: JSON.stringify({
                query: params.query,
                variables: params.variables,
                operationName: params.operationName
            }),
            signal: abortController.signal
        });
        const res = await fetchResult.json();
        if ((fetchResult === null || fetchResult === void 0 ? void 0 : fetchResult.status) !== 200) {
            return {
                errors: [new graphql_1.GraphQLError(`Peer responded with invalid status: ${fetchResult === null || fetchResult === void 0 ? void 0 : fetchResult.status}`)]
            };
        }
        params.lastQueried = params.lastQueried ? params.lastQueried : new Date().getTime();
        const cacheValue = {
            data: res,
            queryParams: params
        };
        fetcherCache.set(params.cacheKey, cacheValue);
        return res;
    }
    catch (err) {
        let errorMessage = err;
        if (err.type === 'aborted') {
            errorMessage = new Error(`Connection to peer (${params.hostURL}) timed out.`);
        }
        (0, server_1.logger)('context').error(`${errorMessage}`);
        return { errors: [err] };
    }
}
function createFetcher(hostURL, token, peerTimeOut) {
    const data = new dataloader_1.default(async (queries) => {
        const results = await Promise.all(queries.map(async ({ query, variables, operationName }) => {
            // Initialize and prepare caching
            const fetchParams = {
                hostURL,
                variables,
                query,
                operationName,
                token,
                cacheKey: '',
                lastQueried: 0,
                timeout: peerTimeOut
            };
            fetchParams.cacheKey = generateCacheKey(fetchParams);
            const cachedData = fetcherCache.get(fetchParams.cacheKey);
            // On initial query add data to cache queue
            if (!cachedData) {
                return await loadFreshData(fetchParams);
            }
            // Serve cached entries direct
            cachedData.queryParams.lastQueried = new Date().getTime();
            return cachedData.data;
        }));
        return results;
    });
    return async ({ query: queryDocument, variables, operationName }) => {
        const query = (0, graphql_1.print)(queryDocument);
        return data.load({ query, variables, operationName });
    };
}
exports.createFetcher = createFetcher;
//# sourceMappingURL=context.js.map