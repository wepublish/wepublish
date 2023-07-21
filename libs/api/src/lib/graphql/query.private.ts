import {
  CanGetPaymentProviders,
  CanGetPeerArticle,
  CanLoginAsOtherUser
} from '@wepublish/permissions/api'
import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {Context} from '../context'
import {ArticleSort} from '../db/article'
import {AuthorSort} from '../db/author'
import {CommentSort} from '../db/comment'
import {SortOrder} from '../db/common'
import {ImageSort} from '../db/image'
import {InvoiceSort} from '../db/invoice'
import {MemberPlanSort} from '../db/memberPlan'
import {PageSort} from '../db/page'
import {PaymentSort} from '../db/payment'
import {SubscriptionSort} from '../db/subscription'
import {UserSort} from '../db/user'
import {UserRoleSort} from '../db/userRole'
import {GivenTokeExpiryToLongError, UserIdNotFound} from '../error'
import {delegateToPeerSchema} from '../utility'
import {
  GraphQLArticle,
  GraphQLArticleConnection,
  GraphQLArticleFilter,
  GraphQLArticleSort,
  GraphQLPeerArticleConnection
} from './article'
import {
  getAdminArticles,
  getArticleById,
  getArticlePreviewLink
} from './article/article.private-queries'
import {GraphQLAuthProvider, GraphQLJWTToken} from './auth'
import {
  GraphQLAuthor,
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort
} from './author'
import {getAdminAuthors, getAuthorByIdOrSlug} from './author/author.private-queries'
import {GraphQLFullCommentRatingSystem} from './comment-rating/comment-rating'
import {getRatingSystem} from './comment-rating/comment-rating.public-queries'
import {
  GraphQLComment,
  GraphQLCommentConnection,
  GraphQLCommentFilter,
  GraphQLCommentSort
} from './comment/comment'
import {getAdminComments, getComment} from './comment/comment.private-queries'
import {GraphQLSortOrder} from './common'
import {
  GraphQLEvent,
  GraphQLEventConnection,
  GraphQLEventFilter,
  GraphQLEventSort
} from './event/event'
import {getAdminEvents} from './event/event.private-queries'
import {EventSort, getEvent, getImportedEventsIds} from './event/event.query'
import {GraphQLImage, GraphQLImageConnection, GraphQLImageFilter, GraphQLImageSort} from './image'
import {getAdminImages, getImageById} from './image/image.private-queries'
import {
  GraphQLInvoice,
  GraphQLInvoiceConnection,
  GraphQLinvoiceFilter,
  GraphQLInvoiceSort
} from './invoice'
import {getAdminInvoices, getInvoiceById} from './invoice/invoice.private-queries'
import {
  getAdminMemberPlans,
  getMemberPlanByIdOrSlug
} from './member-plan/member-plan.private-queries'
import {
  GraphQLMemberPlan,
  GraphQLMemberPlanConnection,
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort
} from './memberPlan'
import {GraphQLNavigation} from './navigation'
import {getNavigationByIdOrKey, getNavigations} from './navigation/navigation.private-queries'
import {GraphQLPage, GraphQLPageConnection, GraphQLPageFilter, GraphQLPageSort} from './page'
import {getAdminPages, getPageById, getPagePreviewLink} from './page/page.private-queries'
import {
  GraphQLPayment,
  GraphQLPaymentConnection,
  GraphQLPaymentFilter,
  GraphQLPaymentSort
} from './payment'
import {
  getPaymentMethodById,
  getPaymentMethods
} from './payment-method/payment-method.private-queries'
import {getAdminPayments, getPaymentById} from './payment/payment.private-queries'
import {GraphQLPaymentMethod, GraphQLPaymentProvider} from './paymentMethod'
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {getAdminPeerArticles} from './peer-article/peer-article.private-queries'
import {
  getAdminPeerProfile,
  getRemotePeerProfile
} from './peer-profile/peer-profile.private-queries'
import {getPeerById, getPeers} from './peer/peer.private-queries'
import {getPermissions} from './permission/permission.private-queries'
import {authorise} from './permissions'
import {
  GraphQLFullPoll,
  GraphQLPollConnection,
  GraphQLPollFilter,
  GraphQLPollSort
} from './poll/poll'
import {getPolls, PollSort} from './poll/poll.private-queries'
import {getPoll} from './poll/poll.public-queries'
import {GraphQLSession} from './session'
import {getSessionsForUser} from './session/session.private-queries'
import {GraphQLSetting} from './setting'
import {getSetting, getSettings} from './setting/setting.private-queries'
import {GraphQLSlug} from './slug'
import {
  GraphQLSubscription,
  GraphQLSubscriptionConnection,
  GraphQLSubscriptionFilter,
  GraphQLSubscriptionSort,
  GraphQLSubscribersPerMonth
} from './subscription'
import {
  getAdminSubscriptions,
  getSubscriptionById,
  getSubscriptionsAsCSV,
  getNewSubscribersPerMonth
} from './subscription/subscription.private-queries'
import {GraphQLTagConnection, GraphQLTagFilter, GraphQLTagSort} from './tag/tag'
import {getTags} from './tag/tag.private-query'
import {TagSort} from './tag/tag.query'
import {GraphQLToken} from './token'
import {getTokens} from './token/token.private-queries'
import {GraphQLUser, GraphQLUserConnection, GraphQLUserFilter, GraphQLUserSort} from './user'
import {getAdminUserRoles, getUserRoleById} from './user-role/user-role.private-queries'
import {getAdminUsers, getMe, getUserById} from './user/user.private-queries'
import {
  GraphQLPermission,
  GraphQLUserRole,
  GraphQLUserRoleConnection,
  GraphQLUserRoleFilter,
  GraphQLUserRoleSort
} from './userRole'
import {GraphQLAction} from './action'
import {getActions} from './action/action.private-queries'

export const GraphQLQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // Peering
    // =======

    remotePeerProfile: {
      type: GraphQLPeerProfile,
      args: {
        hostURL: {type: GraphQLNonNull(GraphQLString)},
        token: {type: GraphQLNonNull(GraphQLString)}
      },
      resolve: (root, {hostURL, token}, {authenticate, prisma: {setting}}, info) =>
        getRemotePeerProfile(hostURL, token, authenticate, info, setting)
    },

    createJWTForUser: {
      type: GraphQLJWTToken,
      args: {
        userId: {type: GraphQLNonNull(GraphQLString)},
        expiresInMinutes: {type: GraphQLNonNull(GraphQLInt)}
      },
      async resolve(root, {userId, expiresInMinutes}, {authenticate, generateJWT, prisma}, info) {
        const THIRTY_DAYS_IN_MIN = 30 * 24 * 60
        const {roles} = authenticate()
        authorise(CanLoginAsOtherUser, roles)

        if (expiresInMinutes > THIRTY_DAYS_IN_MIN) {
          throw new GivenTokeExpiryToLongError()
        }

        const user = await prisma.user.findUnique({
          where: {id: userId}
        })

        if (!user) {
          throw new UserIdNotFound()
        }

        const expiresAt = new Date(
          new Date().getTime() + expiresInMinutes * 60 * 1000
        ).toISOString()

        const token = generateJWT({id: userId, expiresInMinutes})

        return {
          token,
          expiresAt
        }
      }
    },

    peerProfile: {
      type: GraphQLNonNull(GraphQLPeerProfile),
      resolve: (root, args, {authenticate, hostURL, websiteURL, prisma: {peerProfile}}) =>
        getAdminPeerProfile(hostURL, websiteURL, authenticate, peerProfile)
    },

    peers: {
      type: GraphQLList(GraphQLNonNull(GraphQLPeer)),
      resolve: (root, _, {authenticate, prisma: {peer}}) => getPeers(authenticate, peer)
    },

    peer: {
      type: GraphQLPeer,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, loaders: {peer}}) => getPeerById(id, authenticate, peer)
    },

    // User
    // ====

    me: {
      type: GraphQLUser,
      resolve: (root, args, {authenticate}) => getMe(authenticate)
    },

    // Session
    // =======

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      resolve: (root, _, {authenticateUser, prisma: {session, userRole}}) =>
        getSessionsForUser(authenticateUser, session, userRole)
    },

    authProviders: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthProvider))),
      args: {redirectUri: {type: GraphQLString}},
      async resolve(root, {redirectUri}, {getOauth2Clients}) {
        const clients = await getOauth2Clients()
        return clients.map(client => {
          const url = client.client.authorizationUrl({
            scope: client.provider.scopes.join(),
            response_mode: 'query',
            redirect_uri: `${redirectUri}/${client.name}`,
            state: 'fakeRandomString'
          })

          return {
            name: client.name,
            url
          }
        })
      }
    },

    // Users
    // ==========
    user: {
      type: GraphQLUser,
      args: {id: {type: GraphQLID}},
      resolve: (root, {id}, {authenticate, prisma: {user}}) => {
        return getUserById(id, authenticate, user)
      }
    },

    users: {
      type: GraphQLNonNull(GraphQLUserConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLUserFilter},
        sort: {type: GraphQLUserSort, defaultValue: UserSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {filter, sort, order, take, skip, cursor}, {authenticate, prisma: {user}}) =>
        getAdminUsers(filter, sort, order, cursor, skip, take, authenticate, user)
    },

    // Subscriptions
    // ==========
    subscription: {
      type: GraphQLSubscription,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, prisma: {subscription}}) => {
        return getSubscriptionById(id, authenticate, subscription)
      }
    },

    subscriptions: {
      type: GraphQLNonNull(GraphQLSubscriptionConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLSubscriptionFilter},
        sort: {type: GraphQLSubscriptionSort, defaultValue: SubscriptionSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, take, skip, cursor},
        {authenticate, prisma: {subscription}}
      ) =>
        getAdminSubscriptions(filter, sort, order, cursor, skip, take, authenticate, subscription)
    },

    subscriptionsAsCsv: {
      type: GraphQLString,
      args: {filter: {type: GraphQLSubscriptionFilter}},
      resolve: (root, {filter}, {prisma: {subscription}, authenticate}) =>
        getSubscriptionsAsCSV(filter, authenticate, subscription)
    },

    // UserRole
    // ========

    userRole: {
      type: GraphQLUserRole,
      args: {id: {type: GraphQLID}},
      resolve: (root, {id}, {authenticate, loaders}) =>
        getUserRoleById(id, authenticate, loaders.userRolesByID)
    },

    userRoles: {
      type: GraphQLNonNull(GraphQLUserRoleConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLUserRoleFilter},
        sort: {type: GraphQLUserRoleSort, defaultValue: UserRoleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, take, skip, cursor},
        {authenticate, prisma: {userRole}}
      ) => getAdminUserRoles(filter, sort, order, cursor, skip, take, authenticate, userRole)
    },

    // Permissions
    // ========

    permissions: {
      type: GraphQLList(GraphQLNonNull(GraphQLPermission)),
      args: {},
      resolve: (root, _, {authenticate}) => getPermissions(authenticate)
    },

    // Token
    // =====

    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLToken))),
      resolve: (root, args, {authenticateUser, prisma: {token}}) =>
        getTokens(authenticateUser, token)
    },

    // Navigation
    // ==========

    navigation: {
      type: GraphQLNavigation,
      args: {id: {type: GraphQLID}, key: {type: GraphQLID}},
      resolve: (root, {id, key}, {authenticate, loaders: {navigationByID, navigationByKey}}) =>
        getNavigationByIdOrKey(id, key, authenticate, navigationByID, navigationByKey)
    },

    navigations: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLNavigation))),
      resolve: (root, args, {authenticate, prisma: {navigation}}) =>
        getNavigations(authenticate, navigation)
    },

    // Author
    // ======

    author: {
      type: GraphQLAuthor,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve: (root, {id, slug}, {authenticate, loaders: {authorsByID, authorsBySlug}}) =>
        getAuthorByIdOrSlug(id, slug, authenticate, authorsByID, authorsBySlug)
    },

    authors: {
      type: GraphQLNonNull(GraphQLAuthorConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLAuthorFilter},
        sort: {type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, take, skip, cursor},
        {authenticate, prisma: {author}}
      ) => getAdminAuthors(filter, sort, order, cursor, skip, take, authenticate, author)
    },

    // Image
    // =====

    image: {
      type: GraphQLImage,
      args: {id: {type: GraphQLID}},
      resolve: (root, {id}, {authenticate, loaders: {images}}) =>
        getImageById(id, authenticate, images)
    },

    images: {
      type: GraphQLNonNull(GraphQLImageConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 5},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLImageFilter},
        sort: {type: GraphQLImageSort, defaultValue: ImageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {filter, sort, order, skip, take, cursor}, {authenticate, prisma: {image}}) =>
        getAdminImages(filter, sort, order, cursor, skip, take, authenticate, image)
    },

    // Comments
    // =======

    comment: {
      type: GraphQLComment,
      args: {
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      resolve: (root, {id}, {authenticate, prisma: {comment}}) => {
        return getComment(id, authenticate, comment)
      }
    },

    comments: {
      type: GraphQLNonNull(GraphQLCommentConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLCommentFilter},
        sort: {type: GraphQLCommentSort, defaultValue: CommentSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, skip, take, cursor},
        {authenticate, prisma: {comment}}
      ) => getAdminComments(filter, sort, order, cursor, skip, take, authenticate, comment)
    },

    // Article
    // =======

    article: {
      type: GraphQLArticle,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve: (root, {id}, {authenticate, loaders}) =>
        getArticleById(id, authenticate, loaders.articles)
    },

    articles: {
      type: GraphQLNonNull(GraphQLArticleConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLArticleFilter},
        sort: {type: GraphQLArticleSort, defaultValue: ArticleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, skip, take, cursor},
        {authenticate, prisma: {article}}
      ) => getAdminArticles(filter, sort, order, cursor, skip, take, authenticate, article)
    },

    // Peer Article
    // ============

    peerArticle: {
      type: GraphQLArticle,
      args: {peerID: {type: GraphQLNonNull(GraphQLID)}, id: {type: GraphQLNonNull(GraphQLID)}},
      resolve(root, {peerID, id}, context, info) {
        const {authenticate} = context
        const {roles} = authenticate()

        authorise(CanGetPeerArticle, roles)
        return delegateToPeerSchema(peerID, true, context, {fieldName: 'article', args: {id}, info})
      }
    },

    peerArticles: {
      type: GraphQLNonNull(GraphQLPeerArticleConnection),
      args: {
        cursors: {type: GraphQLString},
        take: {type: GraphQLInt, defaultValue: 10},
        // Backwards compatability
        first: {type: GraphQLInt},
        skip: {type: GraphQLInt, defaultValue: 0},
        sort: {type: GraphQLArticleSort, defaultValue: ArticleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending},
        peerFilter: {type: GraphQLString},
        filter: {type: GraphQLArticleFilter}
      },

      resolve: (root, {filter, sort, order, after, peerFilter, take, skip, first}, context, info) =>
        getAdminPeerArticles(
          filter,
          sort,
          order,
          peerFilter,
          after,
          context,
          info,
          take,
          skip,
          first
        )
    },

    articlePreviewLink: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}, hours: {type: GraphQLNonNull(GraphQLInt)}},
      resolve: async (
        root,
        {id, hours},
        {authenticate, loaders: {articles}, urlAdapter, generateJWT}
      ) => getArticlePreviewLink(id, hours, authenticate, generateJWT, urlAdapter, articles)
    },

    // Page
    // ====

    page: {
      type: GraphQLPage,
      args: {id: {type: GraphQLID}},
      resolve: (root, {id}, {authenticate, loaders: {pages}}) =>
        getPageById(id, authenticate, pages)
    },

    pages: {
      type: GraphQLNonNull(GraphQLPageConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLPageFilter},
        sort: {type: GraphQLPageSort, defaultValue: PageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {filter, sort, order, skip, take, cursor}, {authenticate, prisma: {page}}) =>
        getAdminPages(filter, sort, order, cursor, skip, take, authenticate, page)
    },

    pagePreviewLink: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}, hours: {type: GraphQLNonNull(GraphQLInt)}},
      resolve: (root, {id, hours}, {authenticate, loaders: {pages}, urlAdapter, generateJWT}) =>
        getPagePreviewLink(id, hours, authenticate, generateJWT, urlAdapter, pages)
    },

    // MemberPlan
    // ======

    memberPlan: {
      type: GraphQLMemberPlan,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve: (root, {id, slug}, {authenticate, loaders: {memberPlansByID, memberPlansBySlug}}) =>
        getMemberPlanByIdOrSlug(id, slug, authenticate, memberPlansByID, memberPlansBySlug)
    },

    memberPlans: {
      type: GraphQLNonNull(GraphQLMemberPlanConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLMemberPlanFilter},
        sort: {type: GraphQLMemberPlanSort, defaultValue: MemberPlanSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, cursor, take, skip},
        {authenticate, prisma: {memberPlan}}
      ) => getAdminMemberPlans(filter, sort, order, cursor, skip, take, authenticate, memberPlan)
    },

    // PaymentMethod
    // ======

    paymentMethod: {
      type: GraphQLPaymentMethod,
      args: {id: {type: GraphQLID}},
      resolve: (root, {id}, {authenticate, loaders: {paymentMethodsByID}}) =>
        getPaymentMethodById(id, authenticate, paymentMethodsByID)
    },

    paymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentMethod))),
      resolve: (root, _, {authenticate, prisma: {paymentMethod}}) =>
        getPaymentMethods(authenticate, paymentMethod)
    },

    paymentProviders: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentProvider))),
      resolve(root, _, {authenticate, paymentProviders}) {
        const {roles} = authenticate()
        authorise(CanGetPaymentProviders, roles)

        return paymentProviders.map(({id, name}) => ({
          id,
          name
        }))
      }
    },

    // Invoice
    // ======

    invoice: {
      type: GraphQLInvoice,
      args: {id: {type: GraphQLID}},
      resolve: (root, {id}, {authenticate, loaders: {invoicesByID}}) =>
        getInvoiceById(id, authenticate, invoicesByID)
    },

    invoices: {
      type: GraphQLNonNull(GraphQLInvoiceConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLinvoiceFilter},
        sort: {type: GraphQLInvoiceSort, defaultValue: InvoiceSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, cursor, take, skip},
        {authenticate, prisma: {invoice}}
      ) => getAdminInvoices(filter, sort, order, cursor, skip, take, authenticate, invoice)
    },

    // Payment
    // ======

    payment: {
      type: GraphQLPayment,
      args: {id: {type: GraphQLID}},
      resolve: (root, {id}, {authenticate, loaders: {paymentsByID}}) =>
        getPaymentById(id, authenticate, paymentsByID)
    },

    payments: {
      type: GraphQLNonNull(GraphQLPaymentConnection),
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLPaymentFilter},
        sort: {type: GraphQLPaymentSort, defaultValue: PaymentSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (
        root,
        {filter, sort, order, cursor, take, skip},
        {authenticate, prisma: {payment}}
      ) => getAdminPayments(filter, sort, order, cursor, skip, take, authenticate, payment)
    },

    // Setting
    // ======

    setting: {
      type: GraphQLSetting,
      args: {name: {type: GraphQLNonNull(GraphQLString)}},
      resolve: (root, {name}, {authenticate, prisma: {setting}}) =>
        getSetting(name, authenticate, setting)
    },

    settings: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSetting))),
      resolve: (root, _, {authenticate, prisma: {setting}}) => getSettings(authenticate, setting)
    },

    // Rating System
    // ==========

    ratingSystem: {
      type: GraphQLNonNull(GraphQLFullCommentRatingSystem),
      resolve: (root, input, {prisma: {commentRatingSystem}}) =>
        getRatingSystem(commentRatingSystem)
    },

    // Tag
    // ==========

    tags: {
      type: GraphQLTagConnection,
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLTagFilter},
        sort: {type: GraphQLTagSort, defaultValue: TagSort.CreatedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {filter, sort, order, cursor, take, skip}, {authenticate, prisma}) =>
        getTags(filter, sort, order, cursor, skip, take, authenticate, prisma.tag)
    },

    // Polls
    // =======

    polls: {
      type: GraphQLPollConnection,
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLPollFilter},
        sort: {type: GraphQLPollSort, defaultValue: PollSort.OpensAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {cursor, take, skip, filter, sort, order}, {authenticate, prisma: {poll}}) =>
        getPolls(filter, sort, order, cursor, skip, take, authenticate, poll)
    },

    poll: {
      type: GraphQLFullPoll,
      args: {
        id: {type: GraphQLID}
      },
      resolve: (root, {id}, {prisma: {poll}}) => getPoll(id, poll)
    },

    // Events
    // =======

    events: {
      type: GraphQLEventConnection,
      args: {
        cursor: {type: GraphQLID},
        take: {type: GraphQLInt, defaultValue: 10},
        skip: {type: GraphQLInt, defaultValue: 0},
        filter: {type: GraphQLEventFilter},
        sort: {type: GraphQLEventSort, defaultValue: EventSort.StartsAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve: (root, {cursor, take, skip, filter, sort, order}, {authenticate, prisma: {event}}) =>
        getAdminEvents(filter, sort, order, cursor, skip, take, authenticate, event)
    },

    event: {
      type: GraphQLEvent,
      args: {
        id: {type: GraphQLID}
      },
      resolve: (root, {id}, {prisma: {event}}) => getEvent(id, event)
    },

    importedEventsIds: {
      type: GraphQLList(GraphQLString),
      description: 'This query returns a list of original ids of imported events',
      resolve: (root, _, {prisma: {event}}) => getImportedEventsIds(event)
    },

    // Stats
    newSubscribersPerMonth: {
      type: GraphQLList(GraphQLSubscribersPerMonth),
      args: {monthsBack: {type: GraphQLInt}},
      resolve: (root, {monthsBack}, {authenticate, prisma: {subscription}}) => {
        return getNewSubscribersPerMonth(authenticate, subscription, monthsBack)
      }
    },

    // Actions
    // =======
    actions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAction))),
      resolve: (
        root,
        _,
        {authenticate, prisma: {article, page, comment, subscription, author, poll, user, event}}
      ) => {
        return getActions(
          authenticate,
          article,
          page,
          comment,
          subscription,
          author,
          poll,
          user,
          event
        )
      }
    }
  }
})
