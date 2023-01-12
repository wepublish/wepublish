"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphQLQuery = void 0;
const graphql_1 = require("graphql");
const article_1 = require("../db/article");
const author_1 = require("../db/author");
const comment_1 = require("../db/comment");
const common_1 = require("../db/common");
const image_1 = require("../db/image");
const invoice_1 = require("../db/invoice");
const memberPlan_1 = require("../db/memberPlan");
const page_1 = require("../db/page");
const payment_1 = require("../db/payment");
const subscription_1 = require("../db/subscription");
const user_1 = require("../db/user");
const userRole_1 = require("../db/userRole");
const error_1 = require("../error");
const utility_1 = require("../utility");
const article_2 = require("./article");
const article_private_queries_1 = require("./article/article.private-queries");
const auth_1 = require("./auth");
const author_2 = require("./author");
const author_private_queries_1 = require("./author/author.private-queries");
const comment_2 = require("./comment/comment");
const comment_private_queries_1 = require("./comment/comment.private-queries");
const common_2 = require("./common");
const image_2 = require("./image");
const image_private_queries_1 = require("./image/image.private-queries");
const invoice_2 = require("./invoice");
const invoice_private_queries_1 = require("./invoice/invoice.private-queries");
const member_plan_private_queries_1 = require("./member-plan/member-plan.private-queries");
const memberPlan_2 = require("./memberPlan");
const navigation_1 = require("./navigation");
const navigation_private_queries_1 = require("./navigation/navigation.private-queries");
const page_2 = require("./page");
const page_private_queries_1 = require("./page/page.private-queries");
const payment_2 = require("./payment");
const payment_method_private_queries_1 = require("./payment-method/payment-method.private-queries");
const payment_private_queries_1 = require("./payment/payment.private-queries");
const paymentMethod_1 = require("./paymentMethod");
const peer_1 = require("./peer");
const peer_article_private_queries_1 = require("./peer-article/peer-article.private-queries");
const peer_profile_private_queries_1 = require("./peer-profile/peer-profile.private-queries");
const peer_private_queries_1 = require("./peer/peer.private-queries");
const permission_private_queries_1 = require("./permission/permission.private-queries");
const permissions_1 = require("./permissions");
const poll_1 = require("./poll/poll");
const poll_private_queries_1 = require("./poll/poll.private-queries");
const poll_public_queries_1 = require("./poll/poll.public-queries");
const session_1 = require("./session");
const session_private_queries_1 = require("./session/session.private-queries");
const setting_1 = require("./setting");
const setting_private_queries_1 = require("./setting/setting.private-queries");
const slug_1 = require("./slug");
const subscription_2 = require("./subscription");
const subscription_private_queries_1 = require("./subscription/subscription.private-queries");
const tag_1 = require("./tag/tag");
const tag_private_query_1 = require("./tag/tag.private-query");
const token_1 = require("./token");
const token_private_queries_1 = require("./token/token.private-queries");
const user_2 = require("./user");
const user_role_private_queries_1 = require("./user-role/user-role.private-queries");
const user_private_queries_1 = require("./user/user.private-queries");
const comment_rating_public_queries_1 = require("./comment-rating/comment-rating.public-queries");
const userRole_2 = require("./userRole");
const comment_rating_1 = require("./comment-rating/comment-rating");
const activityEvent_1 = require("./activityEvent");
const activityEvent_private_queries_1 = require("./activityEvent/activityEvent.private-queries");
exports.GraphQLQuery = new graphql_1.GraphQLObjectType({
    name: 'Query',
    fields: {
        // Peering
        // =======
        remotePeerProfile: {
            type: peer_1.GraphQLPeerProfile,
            args: {
                hostURL: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                token: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) }
            },
            resolve: (root, { hostURL, token }, { authenticate, prisma: { setting } }, info) => (0, peer_profile_private_queries_1.getRemotePeerProfile)(hostURL, token, authenticate, info, setting)
        },
        createJWTForUser: {
            type: auth_1.GraphQLJWTToken,
            args: {
                userId: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLString) },
                expiresInMinutes: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) }
            },
            async resolve(root, { userId, expiresInMinutes }, { authenticate, generateJWT, prisma }, info) {
                const THIRTY_DAYS_IN_MIN = 30 * 24 * 60;
                const { roles } = authenticate();
                (0, permissions_1.authorise)(permissions_1.CanLoginAsOtherUser, roles);
                if (expiresInMinutes > THIRTY_DAYS_IN_MIN) {
                    throw new error_1.GivenTokeExpiryToLongError();
                }
                const user = await prisma.user.findUnique({
                    where: { id: userId }
                });
                if (!user) {
                    throw new error_1.UserIdNotFound();
                }
                const expiresAt = new Date(new Date().getTime() + expiresInMinutes * 60 * 1000).toISOString();
                const token = generateJWT({ id: userId, expiresInMinutes });
                return {
                    token,
                    expiresAt
                };
            }
        },
        peerProfile: {
            type: (0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeerProfile),
            resolve: (root, args, { authenticate, hostURL, websiteURL, prisma: { peerProfile } }) => (0, peer_profile_private_queries_1.getAdminPeerProfile)(hostURL, websiteURL, authenticate, peerProfile)
        },
        peers: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(peer_1.GraphQLPeer)),
            resolve: (root, _, { authenticate, prisma: { peer } }) => (0, peer_private_queries_1.getPeers)(authenticate, peer)
        },
        peer: {
            type: peer_1.GraphQLPeer,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, loaders: { peer } }) => (0, peer_private_queries_1.getPeerById)(id, authenticate, peer)
        },
        // User
        // ====
        me: {
            type: user_2.GraphQLUser,
            resolve: (root, args, { authenticate }) => (0, user_private_queries_1.getMe)(authenticate)
        },
        // Session
        // =======
        sessions: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(session_1.GraphQLSession))),
            resolve: (root, _, { authenticateUser, prisma: { session, userRole } }) => (0, session_private_queries_1.getSessionsForUser)(authenticateUser, session, userRole)
        },
        authProviders: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(auth_1.GraphQLAuthProvider))),
            args: { redirectUri: { type: graphql_1.GraphQLString } },
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
        // Users
        // ==========
        user: {
            type: user_2.GraphQLUser,
            args: { id: { type: graphql_1.GraphQLID } },
            resolve: (root, { id }, { authenticate, prisma: { user } }) => (0, user_private_queries_1.getUserById)(id, authenticate, user)
        },
        users: {
            type: (0, graphql_1.GraphQLNonNull)(user_2.GraphQLUserConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: user_2.GraphQLUserFilter },
                sort: { type: user_2.GraphQLUserSort, defaultValue: user_1.UserSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, take, skip, cursor }, { authenticate, prisma: { user } }) => (0, user_private_queries_1.getAdminUsers)(filter, sort, order, cursor, skip, take, authenticate, user)
        },
        // Subscriptions
        // ==========
        subscription: {
            type: subscription_2.GraphQLSubscription,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, prisma: { subscription } }) => (0, subscription_private_queries_1.getSubscriptionById)(id, authenticate, subscription)
        },
        subscriptions: {
            type: (0, graphql_1.GraphQLNonNull)(subscription_2.GraphQLSubscriptionConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: subscription_2.GraphQLSubscriptionFilter },
                sort: { type: subscription_2.GraphQLSubscriptionSort, defaultValue: subscription_1.SubscriptionSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, take, skip, cursor }, { authenticate, prisma: { subscription } }) => (0, subscription_private_queries_1.getAdminSubscriptions)(filter, sort, order, cursor, skip, take, authenticate, subscription)
        },
        subscriptionsAsCsv: {
            type: graphql_1.GraphQLString,
            args: { filter: { type: subscription_2.GraphQLSubscriptionFilter } },
            resolve: (root, { filter }, { prisma: { subscription }, authenticate }) => (0, subscription_private_queries_1.getSubscriptionsAsCSV)(filter, authenticate, subscription)
        },
        // Stats
        newSubscribersPastYear: {
            type: (0, graphql_1.GraphQLList)(subscription_2.GraphQLSubscribersPerMonth),
            resolve: async (root, {}, { authenticate, prisma: { subscription } }) => {
                return await (0, subscription_private_queries_1.getNewSubscribersYear)(authenticate, subscription);
            }
        },
        // UserRole
        // ========
        userRole: {
            type: userRole_2.GraphQLUserRole,
            args: { id: { type: graphql_1.GraphQLID } },
            resolve: (root, { id }, { authenticate, loaders }) => (0, user_role_private_queries_1.getUserRoleById)(id, authenticate, loaders.userRolesByID)
        },
        userRoles: {
            type: (0, graphql_1.GraphQLNonNull)(userRole_2.GraphQLUserRoleConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: userRole_2.GraphQLUserRoleFilter },
                sort: { type: userRole_2.GraphQLUserRoleSort, defaultValue: userRole_1.UserRoleSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, take, skip, cursor }, { authenticate, prisma: { userRole } }) => (0, user_role_private_queries_1.getAdminUserRoles)(filter, sort, order, cursor, skip, take, authenticate, userRole)
        },
        // Permissions
        // ========
        permissions: {
            type: (0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(userRole_2.GraphQLPermission)),
            args: {},
            resolve: (root, _, { authenticate }) => (0, permission_private_queries_1.getPermissions)(authenticate)
        },
        // Token
        // =====
        tokens: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(token_1.GraphQLToken))),
            resolve: (root, args, { authenticateUser, prisma: { token } }) => (0, token_private_queries_1.getTokens)(authenticateUser, token)
        },
        // Navigation
        // ==========
        navigation: {
            type: navigation_1.GraphQLNavigation,
            args: { id: { type: graphql_1.GraphQLID }, key: { type: graphql_1.GraphQLID } },
            resolve: (root, { id, key }, { authenticate, loaders: { navigationByID, navigationByKey } }) => (0, navigation_private_queries_1.getNavigationByIdOrKey)(id, key, authenticate, navigationByID, navigationByKey)
        },
        navigations: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(navigation_1.GraphQLNavigation))),
            resolve: (root, args, { authenticate, prisma: { navigation } }) => (0, navigation_private_queries_1.getNavigations)(authenticate, navigation)
        },
        // Author
        // ======
        author: {
            type: author_2.GraphQLAuthor,
            args: { id: { type: graphql_1.GraphQLID }, slug: { type: slug_1.GraphQLSlug } },
            resolve: (root, { id, slug }, { authenticate, loaders: { authorsByID, authorsBySlug } }) => (0, author_private_queries_1.getAuthorByIdOrSlug)(id, slug, authenticate, authorsByID, authorsBySlug)
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
            resolve: (root, { filter, sort, order, take, skip, cursor }, { authenticate, prisma: { author } }) => (0, author_private_queries_1.getAdminAuthors)(filter, sort, order, cursor, skip, take, authenticate, author)
        },
        // Image
        // =====
        image: {
            type: image_2.GraphQLImage,
            args: { id: { type: graphql_1.GraphQLID } },
            resolve: (root, { id }, { authenticate, loaders: { images } }) => (0, image_private_queries_1.getImageById)(id, authenticate, images)
        },
        images: {
            type: (0, graphql_1.GraphQLNonNull)(image_2.GraphQLImageConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 5 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: image_2.GraphQLImageFilter },
                sort: { type: image_2.GraphQLImageSort, defaultValue: image_1.ImageSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, skip, take, cursor }, { authenticate, prisma: { image } }) => (0, image_private_queries_1.getAdminImages)(filter, sort, order, cursor, skip, take, authenticate, image)
        },
        // Comments
        // =======
        comment: {
            type: comment_2.GraphQLComment,
            args: {
                id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }
            },
            resolve: (root, { id }, { authenticate, prisma: { comment } }) => (0, comment_private_queries_1.getComment)(id, authenticate, comment)
        },
        comments: {
            type: (0, graphql_1.GraphQLNonNull)(comment_2.GraphQLCommentConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: comment_2.GraphQLCommentFilter },
                sort: { type: comment_2.GraphQLCommentSort, defaultValue: comment_1.CommentSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, skip, take, cursor }, { authenticate, prisma: { comment } }) => (0, comment_private_queries_1.getAdminComments)(filter, sort, order, cursor, skip, take, authenticate, comment)
        },
        // Article
        // =======
        article: {
            type: article_2.GraphQLArticle,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve: (root, { id }, { authenticate, loaders }) => (0, article_private_queries_1.getArticleById)(id, authenticate, loaders.articles)
        },
        articles: {
            type: (0, graphql_1.GraphQLNonNull)(article_2.GraphQLArticleConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: article_2.GraphQLArticleFilter },
                sort: { type: article_2.GraphQLArticleSort, defaultValue: article_1.ArticleSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, skip, take, cursor }, { authenticate, prisma: { article } }) => (0, article_private_queries_1.getAdminArticles)(filter, sort, order, cursor, skip, take, authenticate, article)
        },
        // Peer Article
        // ============
        peerArticle: {
            type: article_2.GraphQLArticle,
            args: { peerID: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }, id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) } },
            resolve(root, { peerID, id }, context, info) {
                const { authenticate } = context;
                const { roles } = authenticate();
                (0, permissions_1.authorise)(permissions_1.CanGetPeerArticle, roles);
                return (0, utility_1.delegateToPeerSchema)(peerID, true, context, { fieldName: 'article', args: { id }, info });
            }
        },
        peerArticles: {
            type: (0, graphql_1.GraphQLNonNull)(article_2.GraphQLPeerArticleConnection),
            args: {
                cursors: { type: graphql_1.GraphQLString },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                sort: { type: article_2.GraphQLArticleSort, defaultValue: article_1.ArticleSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending },
                peerFilter: { type: graphql_1.GraphQLString },
                filter: { type: article_2.GraphQLArticleFilter }
            },
            resolve: (root, { filter, sort, order, after, peerFilter }, context, info) => (0, peer_article_private_queries_1.getAdminPeerArticles)(filter, sort, order, peerFilter, after, context, info)
        },
        articlePreviewLink: {
            type: graphql_1.GraphQLString,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }, hours: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) } },
            resolve: async (root, { id, hours }, { authenticate, loaders: { articles }, urlAdapter, generateJWT }) => (0, article_private_queries_1.getArticlePreviewLink)(id, hours, authenticate, generateJWT, urlAdapter, articles)
        },
        // Page
        // ====
        page: {
            type: page_2.GraphQLPage,
            args: { id: { type: graphql_1.GraphQLID } },
            resolve: (root, { id }, { authenticate, loaders: { pages } }) => (0, page_private_queries_1.getPageById)(id, authenticate, pages)
        },
        pages: {
            type: (0, graphql_1.GraphQLNonNull)(page_2.GraphQLPageConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: page_2.GraphQLPageFilter },
                sort: { type: page_2.GraphQLPageSort, defaultValue: page_1.PageSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, skip, take, cursor }, { authenticate, prisma: { page } }) => (0, page_private_queries_1.getAdminPages)(filter, sort, order, cursor, skip, take, authenticate, page)
        },
        pagePreviewLink: {
            type: graphql_1.GraphQLString,
            args: { id: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLID) }, hours: { type: (0, graphql_1.GraphQLNonNull)(graphql_1.GraphQLInt) } },
            resolve: (root, { id, hours }, { authenticate, loaders: { pages }, urlAdapter, generateJWT }) => (0, page_private_queries_1.getPagePreviewLink)(id, hours, authenticate, generateJWT, urlAdapter, pages)
        },
        // MemberPlan
        // ======
        memberPlan: {
            type: memberPlan_2.GraphQLMemberPlan,
            args: { id: { type: graphql_1.GraphQLID }, slug: { type: slug_1.GraphQLSlug } },
            resolve: (root, { id, slug }, { authenticate, loaders: { memberPlansByID, memberPlansBySlug } }) => (0, member_plan_private_queries_1.getMemberPlanByIdOrSlug)(id, slug, authenticate, memberPlansByID, memberPlansBySlug)
        },
        memberPlans: {
            type: (0, graphql_1.GraphQLNonNull)(memberPlan_2.GraphQLMemberPlanConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: memberPlan_2.GraphQLMemberPlanFilter },
                sort: { type: memberPlan_2.GraphQLMemberPlanSort, defaultValue: memberPlan_1.MemberPlanSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, cursor, take, skip }, { authenticate, prisma: { memberPlan } }) => (0, member_plan_private_queries_1.getAdminMemberPlans)(filter, sort, order, cursor, skip, take, authenticate, memberPlan)
        },
        // PaymentMethod
        // ======
        paymentMethod: {
            type: paymentMethod_1.GraphQLPaymentMethod,
            args: { id: { type: graphql_1.GraphQLID } },
            resolve: (root, { id }, { authenticate, loaders: { paymentMethodsByID } }) => (0, payment_method_private_queries_1.getPaymentMethodById)(id, authenticate, paymentMethodsByID)
        },
        paymentMethods: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPaymentMethod))),
            resolve: (root, _, { authenticate, prisma: { paymentMethod } }) => (0, payment_method_private_queries_1.getPaymentMethods)(authenticate, paymentMethod)
        },
        paymentProviders: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(paymentMethod_1.GraphQLPaymentProvider))),
            resolve(root, _, { authenticate, paymentProviders }) {
                const { roles } = authenticate();
                (0, permissions_1.authorise)(permissions_1.CanGetPaymentProviders, roles);
                return paymentProviders.map(({ id, name }) => ({
                    id,
                    name
                }));
            }
        },
        // Invoice
        // ======
        invoice: {
            type: invoice_2.GraphQLInvoice,
            args: { id: { type: graphql_1.GraphQLID } },
            resolve: (root, { id }, { authenticate, loaders: { invoicesByID } }) => (0, invoice_private_queries_1.getInvoiceById)(id, authenticate, invoicesByID)
        },
        invoices: {
            type: (0, graphql_1.GraphQLNonNull)(invoice_2.GraphQLInvoiceConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: invoice_2.GraphQLinvoiceFilter },
                sort: { type: invoice_2.GraphQLInvoiceSort, defaultValue: invoice_1.InvoiceSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, cursor, take, skip }, { authenticate, prisma: { invoice } }) => (0, invoice_private_queries_1.getAdminInvoices)(filter, sort, order, cursor, skip, take, authenticate, invoice)
        },
        // Payment
        // ======
        payment: {
            type: payment_2.GraphQLPayment,
            args: { id: { type: graphql_1.GraphQLID } },
            resolve: (root, { id }, { authenticate, loaders: { paymentsByID } }) => (0, payment_private_queries_1.getPaymentById)(id, authenticate, paymentsByID)
        },
        payments: {
            type: (0, graphql_1.GraphQLNonNull)(payment_2.GraphQLPaymentConnection),
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: payment_2.GraphQLPaymentFilter },
                sort: { type: payment_2.GraphQLPaymentSort, defaultValue: payment_1.PaymentSort.ModifiedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, cursor, take, skip }, { authenticate, prisma: { payment } }) => (0, payment_private_queries_1.getAdminPayments)(filter, sort, order, cursor, skip, take, authenticate, payment)
        },
        // Setting
        // ======
        setting: {
            type: setting_1.GraphQLSetting,
            args: { name: { type: graphql_1.GraphQLString } },
            resolve: (root, { name }, { authenticate, prisma: { setting } }) => (0, setting_private_queries_1.getSetting)(name, authenticate, setting)
        },
        settings: {
            type: (0, graphql_1.GraphQLNonNull)((0, graphql_1.GraphQLList)((0, graphql_1.GraphQLNonNull)(setting_1.GraphQLSetting))),
            resolve: (root, {}, { authenticate, prisma: { setting } }) => (0, setting_private_queries_1.getSettings)(authenticate, setting)
        },
        // Rating System
        // ==========
        ratingSystem: {
            type: (0, graphql_1.GraphQLNonNull)(comment_rating_1.GraphQLFullCommentRatingSystem),
            resolve: (root, input, { prisma: { commentRatingSystem } }) => (0, comment_rating_public_queries_1.getRatingSystem)(commentRatingSystem)
        },
        // Tag
        // ==========
        tags: {
            type: tag_1.GraphQLTagConnection,
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: tag_1.GraphQLTagFilter },
                sort: { type: tag_1.GraphQLTagSort, defaultValue: tag_private_query_1.TagSort.CreatedAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { filter, sort, order, cursor, take, skip }, { authenticate, prisma }) => (0, tag_private_query_1.getTags)(filter, sort, order, cursor, skip, take, authenticate, prisma.tag)
        },
        // Polls
        // =======
        polls: {
            type: poll_1.GraphQLPollConnection,
            args: {
                cursor: { type: graphql_1.GraphQLID },
                take: { type: graphql_1.GraphQLInt, defaultValue: 10 },
                skip: { type: graphql_1.GraphQLInt, defaultValue: 0 },
                filter: { type: poll_1.GraphQLPollFilter },
                sort: { type: poll_1.GraphQLPollSort, defaultValue: poll_private_queries_1.PollSort.OpensAt },
                order: { type: common_2.GraphQLSortOrder, defaultValue: common_1.SortOrder.Descending }
            },
            resolve: (root, { cursor, take, skip, filter, sort, order }, { authenticate, prisma: { poll } }) => (0, poll_private_queries_1.getPolls)(filter, sort, order, cursor, skip, take, authenticate, poll)
        },
        poll: {
            type: poll_1.GraphQLFullPoll,
            args: {
                id: { type: graphql_1.GraphQLID }
            },
            resolve: (root, { id }, { prisma: { poll } }) => (0, poll_public_queries_1.getPoll)(id, poll)
        },
        // Activity Event
        // =======
        activityEvents: {
            type: (0, graphql_1.GraphQLList)(activityEvent_1.GraphQLActivityEvent),
            resolve: async (root, {}, { authenticate, prisma: { article, page, comment, subscription, author, poll, user } }) => {
                return (0, activityEvent_private_queries_1.getActivities)(authenticate, article, page, comment, subscription, author, poll, user);
            }
        }
    }
});
//# sourceMappingURL=query.private.js.map