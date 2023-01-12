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
exports.GraphQLAdminMutation = void 0;
const client_1 = require("@prisma/client");
const graphql_1 = require("graphql");
const graphql_iso_date_1 = require("graphql-iso-date");
const block_1 = require("../db/block");
const setting_1 = require("../db/setting");
const user_1 = require("../db/user");
const error_1 = require("../error");
const mailContext_1 = require("../mails/mailContext");
const validator_1 = require("../validator");
const article_1 = require("./article");
const article_private_mutation_1 = require("./article/article.private-mutation");
const author_1 = require("./author");
const author_private_mutation_1 = require("./author/author.private-mutation");
const blocks_1 = require("./blocks");
const comment_1 = require("./comment/comment");
const comment_rating_1 = require("./comment-rating/comment-rating");
const comment_rating_private_mutation_1 = require("./comment-rating/comment-rating.private-mutation");
const comment_private_mutation_1 = require("./comment/comment.private-mutation");
const image_1 = require("./image");
const image_private_mutation_1 = require("./image/image.private-mutation");
const invoice_1 = require("./invoice");
const invoice_private_mutation_1 = require("./invoice/invoice.private-mutation");
const member_plan_private_mutation_1 = require("./member-plan/member-plan.private-mutation");
const memberPlan_1 = require("./memberPlan");
const navigation_1 = require("./navigation");
const navigation_private_mutation_1 = require("./navigation/navigation.private-mutation");
const page_1 = require("./page");
const page_private_mutation_1 = require("./page/page.private-mutation");
const payment_1 = require("./payment");
const payment_method_private_mutation_1 = require("./payment-method/payment-method.private-mutation");
const payment_private_mutation_1 = require("./payment/payment.private-mutation");
const paymentMethod_1 = require("./paymentMethod");
const peer_1 = require("./peer");
const peer_profile_private_mutation_1 = require("./peer-profile/peer-profile.private-mutation");
const peer_private_mutation_1 = require("./peer/peer.private-mutation");
const permissions_1 = require("./permissions");
const poll_1 = require("./poll/poll");
const poll_private_mutation_1 = require("./poll/poll.private-mutation");
const richText_1 = require("./richText");
const session_1 = require("./session");
const session_mutation_1 = require("./session/session.mutation");
const session_private_mutation_1 = require("./session/session.private-mutation");
const session_private_queries_1 = require("./session/session.private-queries");
const setting_2 = require("./setting");
const setting_private_mutation_1 = require("./setting/setting.private-mutation");
const subscription_1 = require("./subscription");
const subscription_private_mutation_1 = require("./subscription/subscription.private-mutation");
const tag_1 = require("./tag/tag");
const tag_private_mutation_1 = require("./tag/tag.private-mutation");
const token_1 = require("./token");
const token_private_mutation_1 = require("./token/token.private-mutation");
const user_2 = require("./user");
const user_role_private_mutation_1 = require("./user-role/user-role.private-mutation");
const user_private_mutation_1 = require("./user/user.private-mutation");
const userRole_1 = require("./userRole");
function mapTeaserUnionMap(value) {
    if (!value)
        return null;
    const valueKeys = Object.keys(value);
    if (valueKeys.length === 0) {
        throw new Error(`Received no teaser types in ${blocks_1.GraphQLTeaserInput.name}.`);
    }
    if (valueKeys.length > 1) {
        throw new Error(`Received multiple teaser types (${JSON.stringify(Object.keys(value))}) in ${blocks_1.GraphQLTeaserInput.name}, they're mutually exclusive.`);
    }
    const type = Object.keys(value)[0];
    const teaserValue = value[type];
    return Object.assign({ type }, teaserValue);
}
function mapBlockUnionMap(value) {
    const valueKeys = Object.keys(value);
    if (valueKeys.length === 0) {
        throw new Error(`Received no block types in ${blocks_1.GraphQLBlockInput.name}.`);
    }
    if (valueKeys.length > 1) {
        throw new Error(`Received multiple block types (${JSON.stringify(Object.keys(value))}) in ${blocks_1.GraphQLBlockInput.name}, they're mutually exclusive.`);
    }
    const type = Object.keys(value)[0];
    const blockValue = value[type];
    switch (type) {
        case block_1.BlockType.TeaserGrid:
            return Object.assign(Object.assign({ type }, blockValue), { teasers: blockValue.teasers.map(mapTeaserUnionMap) });
        case block_1.BlockType.TeaserGridFlex:
            return Object.assign(Object.assign({ type }, blockValue), { flexTeasers: blockValue.flexTeasers.map((_a) => {
                    var { teaser } = _a, value = __rest(_a, ["teaser"]);
                    return (Object.assign(Object.assign({}, value), { teaser: mapTeaserUnionMap(teaser) }));
                }) });
        default:
            return Object.assign({ type }, blockValue);
    }
}
function mapNavigationLinkInput(value) {
    const valueKeys = Object.keys(value);
    if (valueKeys.length === 0) {
        throw new Error(`Received no navigation link types in ${navigation_1.GraphQLNavigationLinkInput.name}.`);
    }
    if (valueKeys.length > 1) {
        throw new Error(`Received multiple navigation link  types (${JSON.stringify(Object.keys(value))}) in ${navigation_1.GraphQLNavigationLinkInput.name}, they're mutually exclusive.`);
    }
    const key = Object.keys(value)[0];
    return Object.assign({ type: key }, value[key]);
}
exports.GraphQLAdminMutation = new graphql_1.GraphQLObjectType({
    name: 'Mutation',
    fields: {
        // Peering
        // =======
        updatePeerProfile: {
            type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeerProfile),
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeerProfileInput) } },
            resolve: (root, { input }, { hostURL, authenticate, prisma: { peerProfile } }) => (0, peer_profile_private_mutation_1.upsertPeerProfile)(input, hostURL, authenticate, peerProfile)
        },
        createPeer: {
            type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeer),
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLCreatePeerInput) } },
            resolve: (root, { input }, { authenticate, prisma: { peer } }) => (0, peer_private_mutation_1.createPeer)(input, authenticate, peer)
        },
        updatePeer: {
            type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeer),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLUpdatePeerInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { peer } }) => (0, peer_private_mutation_1.updatePeer)(id, input, authenticate, peer)
        },
        deletePeer: {
            type: peer_1.GraphQLPeer,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, prisma: { peer } }) => (0, peer_private_mutation_1.deletePeerById)(id, authenticate, peer)
        },
        // Session
        // =======
        createSession: {
            type: (0, graphql_1.GraphQLNonNull)(session_1.GraphQLSessionWithToken),
            args: {
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { email, password }, { sessionTTL, prisma }) => (0, session_mutation_1.createSession)(email, password, sessionTTL, prisma.session, prisma.user, prisma.userRole)
        },
        createSessionWithJWT: {
            type: (0, graphql_1.GraphQLNonNull)(session_1.GraphQLSessionWithToken),
            args: {
                jwt: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { jwt }, { sessionTTL, prisma, verifyJWT }) => (0, session_mutation_1.createJWTSession)(jwt, sessionTTL, verifyJWT, prisma.session, prisma.user, prisma.userRole)
        },
        createSessionWithOAuth2Code: {
            type: (0, graphql_1.GraphQLNonNull)(session_1.GraphQLSessionWithToken),
            args: {
                name: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                code: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                redirectUri: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { name, code, redirectUri }, { sessionTTL, prisma, oauth2Providers }) => (0, session_mutation_1.createOAuth2Session)(name, code, redirectUri, sessionTTL, oauth2Providers, prisma.session, prisma.user, prisma.userRole)
        },
        revokeSession: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean),
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticateUser, prisma: { session } }) => (0, session_private_mutation_1.revokeSessionById)(id, authenticateUser, session)
        },
        revokeActiveSession: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLBoolean),
            args: {},
            resolve: (root, _, { authenticateUser, prisma: { session } }) => (0, session_mutation_1.revokeSessionByToken)(authenticateUser, session)
        },
        sessions: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(session_1.GraphQLSession))),
            args: {},
            resolve: (root, _, { authenticateUser, prisma: { session, userRole } }) => (0, session_private_queries_1.getSessionsForUser)(authenticateUser, session, userRole)
        },
        sendJWTLogin: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            args: {
                url: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            async resolve(root, { url, email }, { authenticate, prisma, generateJWT, mailContext }) {
                var _a, _b;
                const { roles } = authenticate();
                (0, permissions_1.authorise)(permissions_1.CanSendJWTLogin, roles);
                email = email.toLowerCase();
                await validator_1.Validator.login().validateAsync({ email });
                const user = await prisma.user.findUnique({
                    where: { email },
                    select: user_1.unselectPassword
                });
                if (!user)
                    throw new error_1.NotFound('User', email);
                const jwtExpiresSetting = await prisma.setting.findUnique({
                    where: { name: setting_1.SettingName.SEND_LOGIN_JWT_EXPIRES_MIN }
                });
                const jwtExpires = (_a = jwtExpiresSetting === null || jwtExpiresSetting === void 0 ? void 0 : jwtExpiresSetting.value) !== null && _a !== void 0 ? _a : parseInt((_b = process.env.SEND_LOGIN_JWT_EXPIRES_MIN) !== null && _b !== void 0 ? _b : '');
                if (!jwtExpires) {
                    throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');
                }
                const token = generateJWT({
                    id: user.id,
                    expiresInMinutes: jwtExpires
                });
                await mailContext.sendMail({
                    type: mailContext_1.SendMailType.LoginLink,
                    recipient: email,
                    data: {
                        url: `${url}?jwt=${token}`,
                        user
                    }
                });
                return email;
            }
        },
        sendWebsiteLogin: {
            type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString),
            args: {
                email: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            async resolve(root, { url, email }, { authenticate, prisma, generateJWT, mailContext, urlAdapter }) {
                var _a, _b;
                email = email.toLowerCase();
                await validator_1.Validator.login().validateAsync({ email });
                const { roles } = authenticate();
                (0, permissions_1.authorise)(permissions_1.CanSendJWTLogin, roles);
                const jwtExpiresSetting = await prisma.setting.findUnique({
                    where: { name: setting_1.SettingName.SEND_LOGIN_JWT_EXPIRES_MIN }
                });
                const jwtExpires = (_a = jwtExpiresSetting === null || jwtExpiresSetting === void 0 ? void 0 : jwtExpiresSetting.value) !== null && _a !== void 0 ? _a : parseInt((_b = process.env.SEND_LOGIN_JWT_EXPIRES_MIN) !== null && _b !== void 0 ? _b : '');
                if (!jwtExpires)
                    throw new Error('No value set for SEND_LOGIN_JWT_EXPIRES_MIN');
                const user = await prisma.user.findUnique({
                    where: { email },
                    select: user_1.unselectPassword
                });
                if (!user)
                    throw new error_1.NotFound('User', email);
                const token = generateJWT({
                    id: user.id,
                    expiresInMinutes: jwtExpires
                });
                await mailContext.sendMail({
                    type: mailContext_1.SendMailType.LoginLink,
                    recipient: email,
                    data: {
                        url: urlAdapter.getLoginURL(token),
                        user
                    }
                });
                return email;
            }
        },
        // Token
        // =====
        createToken: {
            type: (0, graphql_1.GraphQLNonNull)(token_1.GraphQLCreatedToken),
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(token_1.GraphQLTokenInput) } },
            resolve: (root, { input }, { authenticate, prisma: { token } }) => (0, token_private_mutation_1.createToken)(Object.assign(Object.assign({}, input), { roleIDs: ['peer'] }), authenticate, token)
        },
        deleteToken: {
            type: token_1.GraphQLCreatedToken,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, prisma: { token } }) => (0, token_private_mutation_1.deleteTokenById)(id, authenticate, token)
        },
        // User
        // ====
        createUser: {
            type: user_2.GraphQLUser,
            args: {
                input: { type: (0, graphql_1.GraphQLNonNull)(user_2.GraphQLUserInput) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { input, password }, { hashCostFactor, authenticate, prisma: { user } }) => (0, user_private_mutation_1.createAdminUser)(Object.assign(Object.assign({}, input), { password }), authenticate, hashCostFactor, user)
        },
        updateUser: {
            type: user_2.GraphQLUser,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(user_2.GraphQLUserInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { user } }) => (0, user_private_mutation_1.updateAdminUser)(id, input, authenticate, user)
        },
        resetUserPassword: {
            type: user_2.GraphQLUser,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                password: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                sendMail: { type: graphql_1.GraphQLBoolean }
            },
            resolve: (root, { id, password, sendMail }, { authenticate, mailContext, prisma: { user }, hashCostFactor }) => (0, user_private_mutation_1.resetUserPassword)(id, password, sendMail, hashCostFactor, authenticate, mailContext, user)
        },
        deleteUser: {
            type: user_2.GraphQLUser,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { user } }) => (0, user_private_mutation_1.deleteUserById)(id, authenticate, user)
        },
        // Subscriptions
        // ====
        createSubscription: {
            type: subscription_1.GraphQLSubscription,
            args: {
                input: { type: (0, graphql_1.GraphQLNonNull)(subscription_1.GraphQLSubscriptionInput) }
            },
            resolve: (root, { input }, { authenticate, prisma: { subscription }, memberContext }) => (0, subscription_private_mutation_1.createSubscription)(input, authenticate, memberContext, subscription)
        },
        updateSubscription: {
            type: subscription_1.GraphQLSubscription,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(subscription_1.GraphQLSubscriptionInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma, memberContext }) => (0, subscription_private_mutation_1.updateAdminSubscription)(id, input, authenticate, memberContext, prisma.subscription, prisma.user)
        },
        deleteSubscription: {
            type: subscription_1.GraphQLSubscription,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { subscription } }) => (0, subscription_private_mutation_1.deleteSubscriptionById)(id, authenticate, subscription)
        },
        // UserRole
        // ====
        createUserRole: {
            type: userRole_1.GraphQLUserRole,
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(userRole_1.GraphQLUserRoleInput) } },
            resolve: (root, { input }, { authenticate, prisma: { userRole } }) => (0, user_role_private_mutation_1.createUserRole)(input, authenticate, userRole)
        },
        updateUserRole: {
            type: userRole_1.GraphQLUserRole,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(userRole_1.GraphQLUserRoleInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { userRole } }) => (0, user_role_private_mutation_1.updateUserRole)(id, input, authenticate, userRole)
        },
        deleteUserRole: {
            type: userRole_1.GraphQLUserRole,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { userRole } }) => (0, user_role_private_mutation_1.deleteUserRoleById)(id, authenticate, userRole)
        },
        // Navigation
        // ==========
        createNavigation: {
            type: navigation_1.GraphQLNavigation,
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(navigation_1.GraphQLNavigationInput) } },
            resolve: (root, { input }, { authenticate, prisma: { navigation } }) => (0, navigation_private_mutation_1.createNavigation)(Object.assign(Object.assign({}, input), { links: input.links.map(mapNavigationLinkInput) }), authenticate, navigation)
        },
        updateNavigation: {
            type: navigation_1.GraphQLNavigation,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(navigation_1.GraphQLNavigationInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { navigation } }) => (0, navigation_private_mutation_1.updateNavigation)(id, Object.assign(Object.assign({}, input), { links: input.links.map(mapNavigationLinkInput) }), authenticate, navigation)
        },
        deleteNavigation: {
            type: navigation_1.GraphQLNavigation,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { navigation } }) => (0, navigation_private_mutation_1.deleteNavigationById)(id, authenticate, navigation)
        },
        // Author
        // ======
        createAuthor: {
            type: author_1.GraphQLAuthor,
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(author_1.GraphQLAuthorInput) } },
            resolve: (root, { input }, { authenticate, prisma: { author } }) => (0, author_private_mutation_1.createAuthor)(input, authenticate, author)
        },
        updateAuthor: {
            type: author_1.GraphQLAuthor,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(author_1.GraphQLAuthorInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { author } }) => (0, author_private_mutation_1.updateAuthor)(id, input, authenticate, author)
        },
        deleteAuthor: {
            type: author_1.GraphQLAuthor,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { author } }) => (0, author_private_mutation_1.deleteAuthorById)(id, authenticate, author)
        },
        // Image
        // =====
        uploadImage: {
            type: image_1.GraphQLImage,
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(image_1.GraphQLUploadImageInput) } },
            resolve: (root, { input }, { authenticate, mediaAdapter, prisma: { image } }) => (0, image_private_mutation_1.createImage)(input, authenticate, mediaAdapter, image)
        },
        updateImage: {
            type: image_1.GraphQLImage,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(image_1.GraphQLUpdateImageInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { image } }) => (0, image_private_mutation_1.updateImage)(id, input, authenticate, image)
        },
        deleteImage: {
            type: image_1.GraphQLImage,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, mediaAdapter, prisma: { image } }) => (0, image_private_mutation_1.deleteImageById)(id, authenticate, image, mediaAdapter)
        },
        // Article
        // =======
        createArticle: {
            type: (0, graphql_1.GraphQLNonNull)(article_1.GraphQLArticle),
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(article_1.GraphQLArticleInput) } },
            resolve: (root, { input }, { authenticate, prisma: { article } }) => (0, article_private_mutation_1.createArticle)(Object.assign(Object.assign({}, input), { blocks: input.blocks.map(mapBlockUnionMap) }), authenticate, article)
        },
        updateArticle: {
            type: article_1.GraphQLArticle,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(article_1.GraphQLArticleInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { article } }) => (0, article_private_mutation_1.updateArticle)(id, Object.assign(Object.assign({}, input), { blocks: input.blocks.map(mapBlockUnionMap) }), authenticate, article)
        },
        deleteArticle: {
            type: article_1.GraphQLArticle,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, prisma }) => (0, article_private_mutation_1.deleteArticleById)(id, authenticate, prisma)
        },
        publishArticle: {
            type: article_1.GraphQLArticle,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                publishAt: { type: graphql_iso_date_1.GraphQLDateTime },
                updatedAt: { type: graphql_iso_date_1.GraphQLDateTime },
                publishedAt: { type: graphql_iso_date_1.GraphQLDateTime }
            },
            resolve: (root, { id, publishAt, updatedAt, publishedAt }, { authenticate, prisma: { article } }) => (0, article_private_mutation_1.publishArticle)(id, { publishAt, updatedAt, publishedAt }, authenticate, article)
        },
        unpublishArticle: {
            type: article_1.GraphQLArticle,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, prisma: { article } }) => (0, article_private_mutation_1.unpublishArticle)(id, authenticate, article)
        },
        duplicateArticle: {
            type: (0, graphql_1.GraphQLNonNull)(article_1.GraphQLArticle),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { article }, loaders: { articles } }) => (0, article_private_mutation_1.duplicateArticle)(id, authenticate, articles, article)
        },
        // Page
        // =======
        createPage: {
            type: (0, graphql_1.GraphQLNonNull)(page_1.GraphQLPage),
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(page_1.GraphQLPageInput) } },
            resolve: (root, { input }, { authenticate, prisma: { page } }) => (0, page_private_mutation_1.createPage)(Object.assign(Object.assign({}, input), { blocks: input.blocks.map(mapBlockUnionMap) }), authenticate, page)
        },
        updatePage: {
            type: page_1.GraphQLPage,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(page_1.GraphQLPageInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { page } }) => (0, page_private_mutation_1.updatePage)(id, Object.assign(Object.assign({}, input), { blocks: input.blocks.map(mapBlockUnionMap) }), authenticate, page)
        },
        deletePage: {
            type: page_1.GraphQLPage,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, prisma }) => (0, page_private_mutation_1.deletePageById)(id, authenticate, prisma)
        },
        publishPage: {
            type: page_1.GraphQLPage,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                publishAt: { type: graphql_iso_date_1.GraphQLDateTime },
                updatedAt: { type: graphql_iso_date_1.GraphQLDateTime },
                publishedAt: { type: graphql_iso_date_1.GraphQLDateTime }
            },
            resolve: (root, { id, publishAt, updatedAt, publishedAt }, { authenticate, prisma: { page } }) => (0, page_private_mutation_1.publishPage)(id, { publishAt, updatedAt, publishedAt }, authenticate, page)
        },
        unpublishPage: {
            type: page_1.GraphQLPage,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, prisma: { page } }) => (0, page_private_mutation_1.unpublishPage)(id, authenticate, page)
        },
        duplicatePage: {
            type: (0, graphql_1.GraphQLNonNull)(page_1.GraphQLPage),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { prisma: { page }, loaders: { pages }, authenticate }) => (0, page_private_mutation_1.duplicatePage)(id, authenticate, pages, page)
        },
        // MemberPlan
        // ======
        createMemberPlan: {
            type: memberPlan_1.GraphQLMemberPlan,
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLMemberPlanInput) } },
            resolve: (root, { input }, { authenticate, prisma: { memberPlan } }) => (0, member_plan_private_mutation_1.createMemberPlan)(input, authenticate, memberPlan)
        },
        updateMemberPlan: {
            type: memberPlan_1.GraphQLMemberPlan,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(memberPlan_1.GraphQLMemberPlanInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { memberPlan } }) => (0, member_plan_private_mutation_1.updateMemberPlan)(id, input, authenticate, memberPlan)
        },
        deleteMemberPlan: {
            type: memberPlan_1.GraphQLMemberPlan,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { memberPlan } }) => (0, member_plan_private_mutation_1.deleteMemberPlanById)(id, authenticate, memberPlan)
        },
        // PaymentMethod
        // ======
        createPaymentMethod: {
            type: paymentMethod_1.GraphQLPaymentMethod,
            args: {
                input: { type: (0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPaymentMethodInput) }
            },
            resolve: (root, { input }, { authenticate, prisma: { paymentMethod } }) => (0, payment_method_private_mutation_1.createPaymentMethod)(input, authenticate, paymentMethod)
        },
        updatePaymentMethod: {
            type: paymentMethod_1.GraphQLPaymentMethod,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPaymentMethodInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { paymentMethod } }) => (0, payment_method_private_mutation_1.updatePaymentMethod)(id, input, authenticate, paymentMethod)
        },
        deletePaymentMethod: {
            type: paymentMethod_1.GraphQLPaymentMethod,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { paymentMethod } }) => (0, payment_method_private_mutation_1.deletePaymentMethodById)(id, authenticate, paymentMethod)
        },
        // Invoice
        // ======
        createInvoice: {
            type: invoice_1.GraphQLInvoice,
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(invoice_1.GraphQLInvoiceInput) } },
            resolve: (root, { input }, { authenticate, prisma: { invoice } }) => (0, invoice_private_mutation_1.createInvoice)(input, authenticate, invoice)
        },
        createPaymentFromInvoice: {
            type: payment_1.GraphQLPayment,
            args: { input: { type: (0, graphql_1.GraphQLNonNull)(payment_1.GraphQLPaymentFromInvoiceInput) } },
            resolve: (root, { input }, { authenticate, loaders, paymentProviders, prisma: { payment } }) => (0, payment_private_mutation_1.createPaymentFromInvoice)(input, authenticate, paymentProviders, loaders.invoicesByID, loaders.paymentMethodsByID, payment)
        },
        updateInvoice: {
            type: invoice_1.GraphQLInvoice,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                input: { type: (0, graphql_1.GraphQLNonNull)(invoice_1.GraphQLInvoiceInput) }
            },
            resolve: (root, { id, input }, { authenticate, prisma: { invoice } }) => (0, invoice_private_mutation_1.updateInvoice)(id, input, authenticate, invoice)
        },
        deleteInvoice: {
            type: invoice_1.GraphQLInvoice,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { invoice } }) => (0, invoice_private_mutation_1.deleteInvoiceById)(id, authenticate, invoice)
        },
        // Comment
        // ======
        updateComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLComment),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                revision: { type: comment_1.GraphQLCommentRevisionUpdateInput },
                userID: { type: graphql_1.GraphQLID },
                guestUsername: { type: graphql_1.GraphQLString },
                guestUserImageID: { type: graphql_1.GraphQLID },
                source: { type: graphql_1.GraphQLString },
                tagIds: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) },
                ratingOverrides: {
                    type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(comment_1.GraphQLCommentRatingOverrideUpdateInput))
                }
            },
            resolve: (root, { id, revision, ratingOverrides, userID, guestUsername, guestUserImageID, source, tagIds }, { authenticate, prisma: { comment, commentRatingSystemAnswer } }) => (0, comment_private_mutation_1.updateComment)(id, revision, userID, guestUsername, guestUserImageID, source, tagIds, ratingOverrides, authenticate, commentRatingSystemAnswer, comment)
        },
        createComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLComment),
            args: {
                text: { type: richText_1.GraphQLRichText },
                tagIds: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID)) },
                itemID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                parentID: { type: graphql_1.GraphQLID },
                itemType: {
                    type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLCommentItemType)
                }
            },
            resolve: (root, { text, tagIds, itemID, itemType, parentID }, { authenticate, prisma: { comment } }) => (0, comment_private_mutation_1.createAdminComment)(itemID, itemType, parentID, text, tagIds, authenticate, comment)
        },
        approveComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLComment),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { comment } }) => (0, comment_private_mutation_1.takeActionOnComment)(id, { state: client_1.CommentState.approved }, authenticate, comment)
        },
        rejectComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLComment),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                rejectionReason: { type: comment_1.GraphQLCommentRejectionReason }
            },
            resolve: (root, { id, rejectionReason }, { authenticate, prisma: { comment } }) => (0, comment_private_mutation_1.takeActionOnComment)(id, { state: client_1.CommentState.rejected, rejectionReason }, authenticate, comment)
        },
        requestChangesOnComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLComment),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                rejectionReason: { type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLCommentRejectionReason) }
            },
            resolve: (root, { id, rejectionReason }, { authenticate, prisma: { comment } }) => (0, comment_private_mutation_1.takeActionOnComment)(id, { state: client_1.CommentState.pendingUserChanges, rejectionReason }, authenticate, comment)
        },
        deleteComment: {
            type: (0, graphql_1.GraphQLNonNull)(comment_1.GraphQLComment),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { comment } }) => (0, comment_private_mutation_1.deleteComment)(id, authenticate, comment)
        },
        // Settings
        // ==========
        updateSettingList: {
            type: (0, graphql_1.GraphQLList)(setting_2.GraphQLSetting),
            args: {
                value: { type: (0, graphql_1.GraphQLList)(setting_2.GraphQLUpdateSettingArgs) }
            },
            resolve: (root, { value }, { authenticate, prisma }) => (0, setting_private_mutation_1.updateSettings)(value, authenticate, prisma)
        },
        // Rating System
        // ==========
        createRatingSystemAnswer: {
            type: (0, graphql_1.GraphQLNonNull)(comment_rating_1.GraphQLCommentRatingSystemAnswer),
            args: {
                ratingSystemId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                type: { type: comment_rating_1.GraphQLRatingSystemType, defaultValue: client_1.RatingSystemType.star },
                answer: { type: graphql_1.GraphQLString }
            },
            resolve: (root, { ratingSystemId, type, answer }, { authenticate, prisma: { commentRatingSystemAnswer } }) => (0, comment_rating_private_mutation_1.createCommentRatingAnswer)(ratingSystemId, type, answer, authenticate, commentRatingSystemAnswer)
        },
        updateRatingSystem: {
            type: (0, graphql_1.GraphQLNonNull)(comment_rating_1.GraphQLFullCommentRatingSystem),
            args: {
                ratingSystemId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                name: { type: graphql_1.GraphQLString },
                answers: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(comment_rating_1.GraphQLUpdateCommentRatingSystemAnswer)) }
            },
            resolve: (root, { ratingSystemId, answers, name }, { authenticate, prisma: { commentRatingSystem } }) => (0, comment_rating_private_mutation_1.updateRatingSystem)(ratingSystemId, name, answers, authenticate, commentRatingSystem)
        },
        deleteRatingSystemAnswer: {
            type: (0, graphql_1.GraphQLNonNull)(comment_rating_1.GraphQLCommentRatingSystemAnswer),
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { commentRatingSystemAnswer } }) => (0, comment_rating_private_mutation_1.deleteCommentRatingAnswer)(id, authenticate, commentRatingSystemAnswer)
        },
        // Poll
        // ==========
        createPoll: {
            type: poll_1.GraphQLPollWithAnswers,
            args: {
                opensAt: { type: graphql_iso_date_1.GraphQLDateTime },
                closedAt: { type: graphql_iso_date_1.GraphQLDateTime },
                question: { type: graphql_1.GraphQLString }
            },
            resolve: (root, input, { authenticate, prisma: { poll } }) => (0, poll_private_mutation_1.createPoll)(input, authenticate, poll)
        },
        createPollAnswer: {
            type: poll_1.GraphQLPollAnswer,
            args: {
                pollId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                answer: { type: graphql_1.GraphQLString }
            },
            resolve: (root, { pollId, answer }, { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }) => (0, poll_private_mutation_1.createPollAnswer)(pollId, answer, authenticate, pollExternalVoteSource, pollAnswer)
        },
        createPollExternalVoteSource: {
            type: poll_1.GraphQLPollExternalVoteSource,
            args: {
                pollId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                source: { type: graphql_1.GraphQLString }
            },
            resolve: (root, { pollId, source }, { authenticate, prisma: { pollExternalVoteSource, pollAnswer } }) => (0, poll_private_mutation_1.createPollExternalVoteSource)(pollId, source, authenticate, pollAnswer, pollExternalVoteSource)
        },
        updatePoll: {
            type: poll_1.GraphQLFullPoll,
            args: {
                pollId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                opensAt: { type: graphql_iso_date_1.GraphQLDateTime },
                closedAt: { type: graphql_iso_date_1.GraphQLDateTime },
                question: { type: graphql_1.GraphQLString },
                answers: { type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(poll_1.GraphQLUpdatePollAnswer)) },
                externalVoteSources: {
                    type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(poll_1.GraphQLUpdatePollExternalVoteSources))
                }
            },
            resolve: (root, _a, _b) => {
                var { pollId, answers, externalVoteSources } = _a, pollInput = __rest(_a, ["pollId", "answers", "externalVoteSources"]);
                var authenticate = _b.authenticate, poll = _b.prisma.poll;
                return (0, poll_private_mutation_1.updatePoll)(pollId, pollInput, answers, externalVoteSources, authenticate, poll);
            }
        },
        deletePoll: {
            type: poll_1.GraphQLFullPoll,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { poll } }) => (0, poll_private_mutation_1.deletePoll)(id, authenticate, poll)
        },
        deletePollAnswer: {
            type: poll_1.GraphQLPollAnswerWithVoteCount,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { pollAnswer } }) => (0, poll_private_mutation_1.deletePollAnswer)(id, authenticate, pollAnswer)
        },
        deletePollExternalVoteSource: {
            type: poll_1.GraphQLPollExternalVoteSource,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { pollExternalVoteSource } }) => (0, poll_private_mutation_1.deletePollExternalVoteSource)(id, authenticate, pollExternalVoteSource)
        },
        // Tag
        // ==========
        createTag: {
            type: tag_1.GraphQLTag,
            args: {
                tag: { type: graphql_1.GraphQLString },
                type: { type: (0, graphql_1.GraphQLNonNull)(tag_1.GraphQLTagType) }
            },
            resolve: (root, { tag, type }, { authenticate, prisma }) => (0, tag_private_mutation_1.createTag)(tag, type, authenticate, prisma.tag)
        },
        updateTag: {
            type: tag_1.GraphQLTag,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                tag: { type: graphql_1.GraphQLString }
            },
            resolve: (root, { id, tag }, { authenticate, prisma }) => (0, tag_private_mutation_1.updateTag)(id, tag, authenticate, prisma.tag)
        },
        deleteTag: {
            type: tag_1.GraphQLTag,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { tag } }) => (0, tag_private_mutation_1.deleteTag)(id, authenticate, tag)
        }
    }
});
//# sourceMappingURL=mutation.private.js.map