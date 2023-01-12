"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLPublicQuery = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const graphql_1 = require("graphql");
const article_1 = require("../db/article");
const author_1 = require("../db/author");
const common_1 = require("../db/common");
const memberPlan_1 = require("../db/memberPlan");
const page_1 = require("../db/page");
const session_1 = require("../db/session");
const error_1 = require("../error");
const server_1 = require("../server");
const utility_1 = require("../utility");
const article_2 = require("./article");
const article_public_queries_1 = require("./article/article.public-queries");
const auth_1 = require("./auth");
const author_2 = require("./author");
const author_public_queries_1 = require("./author/author.public-queries");
const challenge_1 = require("./challenge");
const comment_rating_1 = require("./comment-rating/comment-rating");
const comment_rating_public_queries_1 = require("./comment-rating/comment-rating.public-queries");
const common_2 = require("./common");
const invoice_1 = require("./invoice");
const invoice_public_queries_1 = require("./invoice/invoice.public-queries");
const member_plan_public_queries_1 = require("./member-plan/member-plan.public-queries");
const memberPlan_2 = require("./memberPlan");
const navigation_1 = require("./navigation");
const page_2 = require("./page");
const page_public_queries_1 = require("./page/page.public-queries");
const peer_1 = require("./peer");
const peer_profile_public_queries_1 = require("./peer-profile/peer-profile.public-queries");
const peer_public_queries_1 = require("./peer/peer.public-queries");
const poll_1 = require("./poll/poll");
const poll_public_queries_1 = require("./poll/poll.public-queries");
const slug_1 = require("./slug");
const subscription_1 = require("./subscription");
const user_1 = require("./user");
const comment_1 = require("./comment/comment");
const comment_public_queries_1 = require("./comment/comment.public-queries");
exports.GraphQLPublicQuery = new graphql_1.GraphQLObjectType({
    name: 'Query',
    fields: {
        // Settings
        // ========
        peerProfile: {
            type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeerProfile),
            description: 'This query returns the peer profile.',
            resolve: (root, args, { hostURL, websiteURL, prisma: { peerProfile } }) => (0, peer_profile_public_queries_1.getPublicPeerProfile)(hostURL, websiteURL, peerProfile)
        },
        peer: {
            type: peer_1.GraphQLPeer,
            args: { id: { type: graphql_1.GraphQLID }, slug: { type: slug_1.GraphQLSlug } },
            description: 'This query takes either the ID or the slug and returns the peer profile.',
            resolve: (root, { id, slug }, { loaders: { peer, peerBySlug } }) => (0, peer_public_queries_1.getPeerByIdOrSlug)(id, slug, peer, peerBySlug)
        },
        // Navigation
        // ==========
        navigation: {
            type: navigation_1.GraphQLPublicNavigation,
            args: { id: { type: graphql_1.GraphQLID }, key: { type: graphql_1.GraphQLID } },
            description: 'This query takes either the ID or the key and returns the navigation.',
            resolve(root, { id, key }, { loaders }) {
                if ((id == null && key == null) || (id != null && key != null)) {
                    throw new apollo_server_express_1.UserInputError('You must provide either `id` or `key`.');
                }
                return id ? loaders.navigationByID.load(id) : loaders.navigationByKey.load(key);
            }
        },
        // Author
        // ======
        author: {
            type: author_2.GraphQLAuthor,
            args: { id: { type: graphql_1.GraphQLID }, slug: { type: slug_1.GraphQLSlug } },
            description: 'This query takes either the ID or the slug and returns the author.',
            resolve(root, { id, slug }, { authenticateUser, loaders }) {
                if ((id == null && slug == null) || (id != null && slug != null)) {
                    throw new apollo_server_express_1.UserInputError('You must provide either `id` or `slug`.');
                }
                return id ? loaders.authorsByID.load(id) : loaders.authorsBySlug.load(slug);
            }
        },
        authors: {
            type: (0, graphql_1.GraphQLNonNull)(author_2.GraphQLAuthorConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: author_2.GraphQLAuthorFilter },
                sort: { type: author_2.GraphQLAuthorSort, defaultValue: author_1.AuthorSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            description: 'This query is to get the authors.',
            resolve: (root, { filter, sort, order, take, skip, cursor }, { prisma: { author } }) => (0, author_public_queries_1.getPublicAuthors)(filter, sort, order, cursor, skip, take, author)
        },
        // Article
        // =======
        article: {
            type: article_2.GraphQLPublicArticle,
            args: {
                id: { type: graphql_1.GraphQLID },
                slug: { type: slug_1.GraphQLSlug },
                token: { type: graphql_1.GraphQLString }
            },
            description: 'This query takes either the ID, slug or token and returns the article.',
            resolve: (root, { id, slug, token }, { session, loaders: { articles, publicArticles }, prisma: { article }, verifyJWT }) => (0, article_public_queries_1.getPublishedArticleByIdOrSlug)(id, slug, token, session, verifyJWT, publicArticles, articles, article)
        },
        articles: {
            type: (0, graphql_1.GraphQLNonNull)(article_2.GraphQLPublicArticleConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: article_2.GraphQLPublicArticleFilter },
                sort: { type: article_2.GraphQLPublicArticleSort, defaultValue: article_1.ArticleSort.PublishedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            description: 'This query returns the articles.',
            resolve: (root, { filter, sort, order, skip, take, cursor }, { prisma: { article } }) => (0, article_public_queries_1.getPublishedArticles)(filter, sort, order, cursor, skip, take, article)
        },
        // Peer Article
        // ============
        peerArticle: {
            type: article_2.GraphQLPublicArticle,
            args: {
                peerID: { type: graphql_1.GraphQLID },
                peerSlug: { type: slug_1.GraphQLSlug },
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            description: 'This query takes either the peer ID or the peer slug and returns the article.',
            async resolve(root, { peerID, peerSlug, id }, context, info) {
                const { loaders } = context;
                if ((peerID == null && peerSlug == null) || (peerID != null && peerSlug != null)) {
                    throw new apollo_server_express_1.UserInputError('You must provide either `peerID` or `peerSlug`.');
                }
                if (peerSlug) {
                    const peer = await loaders.peerBySlug.load(peerSlug);
                    if (peer) {
                        peerID = peer.id;
                        loaders.peer.prime(peer.id, peer);
                    }
                }
                if (!peerID)
                    return null;
                return (0, utility_1.delegateToPeerSchema)(peerID, false, context, {
                    fieldName: 'article',
                    args: { id },
                    info
                });
            }
        },
        // Page
        // =======
        page: {
            type: page_2.GraphQLPublicPage,
            args: {
                id: { type: graphql_1.GraphQLID },
                slug: { type: slug_1.GraphQLSlug },
                token: { type: graphql_1.GraphQLString }
            },
            description: 'This query takes either the ID, slug or token and returns the page.',
            async resolve(root, { id, slug, token }, { session, loaders, verifyJWT }) {
                var _a;
                let page = id ? await loaders.publicPagesByID.load(id) : null;
                if (!page && slug !== undefined) {
                    // slug can be empty string
                    page = await loaders.publicPagesBySlug.load(slug);
                }
                if (!page && token) {
                    try {
                        const pageId = verifyJWT(token);
                        const privatePage = await loaders.pages.load(pageId);
                        page = (privatePage === null || privatePage === void 0 ? void 0 : privatePage.draft)
                            ? Object.assign(Object.assign({}, privatePage.draft), { id: privatePage.id, updatedAt: new Date(), publishedAt: new Date() })
                            : null;
                    }
                    catch (error) {
                        (0, server_1.logger)('graphql-query').warn(error, 'Error while verifying token with page id.');
                    }
                }
                if (!page)
                    throw new error_1.NotFound('Page', (_a = id !== null && id !== void 0 ? id : slug) !== null && _a !== void 0 ? _a : token);
                return page;
            }
        },
        pages: {
            type: (0, graphql_1.GraphQLNonNull)(page_2.GraphQLPublicPageConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: page_2.GraphQLPublishedPageFilter },
                sort: { type: page_2.GraphQLPublishedPageSort, defaultValue: page_1.PageSort.PublishedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            description: 'This query returns the pages.',
            resolve: (root, { filter, sort, order, cursor, take, skip }, { prisma: { page } }) => (0, page_public_queries_1.getPublishedPages)(filter, sort, order, cursor, skip, take, page)
        },
        // Comments
        // =======
        comments: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(comment_1.GraphQLPublicComment))),
            args: {
                itemId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) },
                sort: { type: comment_1.GraphQLPublicCommentSort },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            description: 'This query returns the comments of an item.',
            resolve: (root, { itemId, sort, order }, { prisma: { comment, commentRatingSystemAnswer } }) => (0, comment_public_queries_1.getPublicCommentsForItemById)(itemId, null, sort, order, commentRatingSystemAnswer, comment)
        },
        userCommentRatings: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)(comment_rating_1.GraphQLCommentRating)),
            args: {
                commentId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            description: 'This query returns the value of a comments answer rating if the user has already rated it.',
            resolve: (root, { commentId }, { authenticateUser, prisma: { commentRating } }) => (0, comment_rating_public_queries_1.userCommentRating)(commentId, authenticateUser, commentRating)
        },
        // Auth
        // =======
        authProviders: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(auth_1.GraphQLAuthProvider))),
            args: { redirectUri: { type: graphql_1.GraphQLString } },
            description: 'This query returns the redirect Uri.',
            async resolve(root, { redirectUri }, { getOauth2Clients }) {
                const clients = await getOauth2Clients();
                return clients.map(client => {
                    const url = client.client.authorizationUrl({
                        scope: client.provider.scopes.join(),
                        response_mode: 'query',
                        redirect_uri: `${redirectUri}/${client.name}`,
                        state: 'fakeRandomString'
                    });
                    return {
                        name: client.name,
                        url
                    };
                });
            }
        },
        // User
        // ====
        me: {
            type: user_1.GraphQLPublicUser,
            description: 'This query returns the user.',
            resolve(root, args, { session }) {
                return (session === null || session === void 0 ? void 0 : session.type) === session_1.SessionType.User ? session.user : null;
            }
        },
        invoices: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(invoice_1.GraphQLPublicInvoice))),
            description: 'This query returns the invoices  of the authenticated user.',
            resolve: (root, _, { authenticateUser, prisma: { subscription, invoice } }) => (0, invoice_public_queries_1.getPublicInvoices)(authenticateUser, subscription, invoice)
        },
        subscriptions: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(subscription_1.GraphQLPublicSubscription))),
            description: 'This query returns the subscriptions of the authenticated user.',
            async resolve(root, _, { authenticateUser, prisma }) {
                const { user } = authenticateUser();
                return await prisma.subscription.findMany({
                    where: {
                        userID: user.id
                    },
                    include: {
                        deactivation: true,
                        periods: true,
                        properties: true
                    }
                });
            }
        },
        memberPlan: {
            type: memberPlan_2.GraphQLPublicMemberPlan,
            args: { id: { type: graphql_1.GraphQLID }, slug: { type: slug_1.GraphQLSlug } },
            description: 'This query returns a member plan.',
            resolve(root, { id, slug }, { loaders }) {
                if ((!id && !slug) || (id && slug)) {
                    throw new apollo_server_express_1.UserInputError('You must provide either `id` or `slug`.');
                }
                return id
                    ? loaders.activeMemberPlansByID.load(id)
                    : loaders.activeMemberPlansBySlug.load(slug);
            }
        },
        memberPlans: {
            type: (0, graphql_1.GraphQLNonNull)(memberPlan_2.GraphQLPublicMemberPlanConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: memberPlan_2.GraphQLMemberPlanFilter },
                sort: { type: memberPlan_2.GraphQLMemberPlanSort, defaultValue: memberPlan_1.MemberPlanSort.CreatedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            description: 'This query returns the member plans.',
            resolve: (root, { filter, sort, order, take, skip, cursor }, { prisma: { memberPlan } }) => (0, member_plan_public_queries_1.getActiveMemberPlans)(filter, sort, order, cursor, skip, take, memberPlan)
        },
        checkInvoiceStatus: {
            type: invoice_1.GraphQLPublicInvoice,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            description: 'This mutation will check the invoice status and update with information from the paymentProvider',
            async resolve(root, { id }, context) {
                const { authenticateUser, prisma, paymentProviders } = context;
                const { user } = authenticateUser();
                const invoice = await prisma.invoice.findUnique({
                    where: {
                        id
                    },
                    include: {
                        items: true
                    }
                });
                if (!invoice || !invoice.subscriptionID) {
                    throw new error_1.NotFound('Invoice', id);
                }
                const subscription = await prisma.subscription.findUnique({
                    where: {
                        id: invoice.subscriptionID
                    }
                });
                if (!subscription || subscription.userID !== user.id) {
                    throw new error_1.NotFound('Invoice', id);
                }
                const payments = await prisma.payment.findMany({
                    where: {
                        invoiceID: invoice.id
                    }
                });
                const paymentMethods = await prisma.paymentMethod.findMany({
                    where: {
                        active: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                });
                for (const payment of payments) {
                    if (!payment || !payment.intentID)
                        continue;
                    const paymentMethod = paymentMethods.find(pm => pm.id === payment.paymentMethodID);
                    if (!paymentMethod)
                        continue; // TODO: what happens if we don't find a paymentMethod
                    const paymentProvider = paymentProviders.find(pp => pp.id === paymentMethod.paymentProviderID);
                    if (!paymentProvider)
                        continue; // TODO: what happens if we don't find a paymentProvider
                    const intentState = await paymentProvider.checkIntentStatus({ intentID: payment.intentID });
                    await paymentProvider.updatePaymentWithIntentState({
                        intentState,
                        paymentClient: context.prisma.payment,
                        paymentsByID: context.loaders.paymentsByID,
                        invoicesByID: context.loaders.invoicesByID,
                        subscriptionClient: prisma.subscription,
                        userClient: prisma.user,
                        invoiceClient: context.prisma.invoice,
                        subscriptionPeriodClient: context.prisma.subscriptionPeriod,
                        invoiceItemClient: context.prisma.invoiceItem
                    });
                }
                // FIXME: We need to implement a way to wait for all the database
                //  event hooks to finish before we return data. Will be solved in WPC-498
                await new Promise(resolve => setTimeout(resolve, 100));
                return await prisma.invoice.findUnique({
                    where: {
                        id
                    },
                    include: {
                        items: true
                    }
                });
            }
        },
        // Challenge
        // =======
        challenge: {
            type: (0, graphql_1.GraphQLNonNull)(challenge_1.GraphQLChallenge),
            description: 'This query generates a challenge which can be used to access protected endpoints.',
            async resolve(_, { input }, { challenge }) {
                const c = await challenge.generateChallenge();
                return {
                    challenge: c.challenge,
                    challengeID: c.challengeID,
                    validUntil: c.validUntil
                };
            }
        },
        // Rating System
        // ==========
        ratingSystem: {
            type: (0, graphql_1.GraphQLNonNull)(comment_rating_1.GraphQLFullCommentRatingSystem),
            resolve: (root, input, { prisma: { commentRatingSystem } }) => (0, comment_rating_public_queries_1.getRatingSystem)(commentRatingSystem)
        },
        // Poll
        // =======
        poll: {
            type: (0, graphql_1.GraphQLNonNull)(poll_1.GraphQLFullPoll),
            description: 'This query returns a poll with all the needed data',
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { prisma: { poll } }) => (0, poll_public_queries_1.getPoll)(id, poll)
        },
        userPollVote: {
            type: graphql_1.GraphQLID,
            description: 'This query returns the answerId of a poll if the user has already voted on it.',
            args: {
                pollId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { pollId }, { authenticateUser, prisma: { pollVote } }) => (0, poll_public_queries_1.userPollVote)(pollId, authenticateUser, pollVote)
        }
    }
});
//# sourceMappingURL=query.public.js.map