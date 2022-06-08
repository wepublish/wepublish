import {UserInputError} from 'apollo-server-express'
import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {delegateToSchema, introspectSchema, makeRemoteExecutableSchema} from 'graphql-tools'
import {Context, createFetcher} from '../context'
import {ArticleSort} from '../db/article'
import {AuthorSort} from '../db/author'
import {CommentSort} from '../db/comment'
import {ConnectionResult, InputCursor, Limit, SortOrder} from '../db/common'
import {ImageSort} from '../db/image'
import {InvoiceSort} from '../db/invoice'
import {MemberPlanSort} from '../db/memberPlan'
import {PageSort} from '../db/page'
import {PaymentSort} from '../db/payment'
import {SessionType} from '../db/session'
import {Subscription, SubscriptionSort} from '../db/subscription'
import {User, UserSort} from '../db/user'
import {UserRoleSort} from '../db/userRole'
import {DisabledPeerError, NotAuthorisedError, NotFound, PeerTokenInvalidError} from '../error'
import {delegateToPeerSchema, mapSubscriptionsAsCsv, markResultAsProxied} from '../utility'
import {
  GraphQLArticle,
  GraphQLArticleConnection,
  GraphQLArticleFilter,
  GraphQLArticleSort,
  GraphQLPeerArticleConnection
} from './article'
import {GraphQLAuthProvider} from './auth'
import {
  GraphQLAuthor,
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort
} from './author'
import {GraphQLCommentConnection, GraphQLCommentFilter, GraphQLCommentSort} from './comment'
import {GraphQLSortOrder} from './common'
import {GraphQLImage, GraphQLImageConnection, GraphQLImageFilter, GraphQLImageSort} from './image'
import {
  GraphQLInvoice,
  GraphQLInvoiceConnection,
  GraphQLinvoiceFilter,
  GraphQLInvoiceSort
} from './invoice'
import {
  GraphQLMemberPlan,
  GraphQLMemberPlanConnection,
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort
} from './memberPlan'
import {GraphQLNavigation} from './navigation'
import {GraphQLPage, GraphQLPageConnection, GraphQLPageFilter, GraphQLPageSort} from './page'
import {
  GraphQLPayment,
  GraphQLPaymentConnection,
  GraphQLPaymentFilter,
  GraphQLPaymentSort
} from './payment'
import {GraphQLPaymentMethod, GraphQLPaymentProvider} from './paymentMethod'
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {
  AllPermissions,
  authorise,
  CanCreatePeer,
  CanGetAuthor,
  CanGetAuthors,
  CanGetComments,
  CanGetImage,
  CanGetImages,
  CanGetInvoice,
  CanGetInvoices,
  CanGetMemberPlan,
  CanGetMemberPlans,
  CanGetNavigation,
  CanGetNavigations,
  CanGetPage,
  CanGetPagePreviewLink,
  CanGetPages,
  CanGetPayment,
  CanGetPaymentMethod,
  CanGetPaymentMethods,
  CanGetPaymentProviders,
  CanGetPayments,
  CanGetPeer,
  CanGetPeerArticle,
  CanGetPeerProfile,
  CanGetPeers,
  CanGetPermissions,
  CanGetSubscription,
  CanGetSubscriptions,
  CanGetUser,
  CanGetUserRole,
  CanGetUserRoles,
  CanGetUsers,
  isAuthorised
} from './permissions'
import {GraphQLSession} from './session'
import {GraphQLSlug} from './slug'
import {
  GraphQLSubscription,
  GraphQLSubscriptionConnection,
  GraphQLSubscriptionFilter,
  GraphQLSubscriptionSort
} from './subscription'
import {GraphQLToken} from './token'
import {GraphQLUser, GraphQLUserConnection, GraphQLUserFilter, GraphQLUserSort} from './user'
import {
  GraphQLPermission,
  GraphQLUserRole,
  GraphQLUserRoleConnection,
  GraphQLUserRoleFilter,
  GraphQLUserRoleSort
} from './userRole'

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
      async resolve(root, {hostURL, token}, {authenticate}, info) {
        const {roles} = authenticate()
        authorise(CanCreatePeer, roles)
        const link = new URL('/admin', hostURL)
        const fetcher = await createFetcher(link.toString(), token)
        const schema = await introspectSchema(fetcher)
        const remoteExecutableSchema = await makeRemoteExecutableSchema({
          schema,
          fetcher
        })
        const remoteAnswer = await delegateToSchema({
          info,
          fieldName: 'peerProfile',
          args: {},
          schema: remoteExecutableSchema,
          transforms: []
        })

        if (remoteAnswer?.extensions?.code === 'UNAUTHENTICATED') {
          // check for unauthenticated error and throw more specific error.
          // otherwise client doesn't know who (own or remote api) threw the error
          throw new PeerTokenInvalidError(link.toString())
        } else {
          return await markResultAsProxied(remoteAnswer)
        }
      }
    },

    peerProfile: {
      type: GraphQLNonNull(GraphQLPeerProfile),
      async resolve(root, args, {authenticate, hostURL, websiteURL, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetPeerProfile, roles)
        return {...(await dbAdapter.peer.getPeerProfile()), hostURL, websiteURL}
      }
    },

    peers: {
      type: GraphQLList(GraphQLNonNull(GraphQLPeer)),
      resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetPeers, roles)

        return dbAdapter.peer.getPeers()
      }
    },

    peer: {
      type: GraphQLPeer,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetPeer, roles)

        const peer = await loaders.peer.load(id)

        if (peer?.isDisabled) {
          throw new DisabledPeerError()
        }

        return peer
      }
    },

    // User
    // ====

    me: {
      type: GraphQLUser,
      resolve(root, args, {authenticate}) {
        const session = authenticate()
        return session?.type === SessionType.User ? session.user : null
      }
    },

    // Session
    // =======

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      resolve(root, args, {authenticateUser, dbAdapter}) {
        const session = authenticateUser()
        return dbAdapter.session.getUserSessions(session.user)
      }
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
      resolve: (root, {id}, {authenticate, prisma: {user}}) => getUserById(id, authenticate, user)
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
      resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetSubscription, roles)
        return dbAdapter.subscription.getSubscriptionByID(id)
      }
    },

    subscriptions: {
      type: GraphQLNonNull(GraphQLSubscriptionConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        skip: {type: GraphQLInt},
        filter: {type: GraphQLSubscriptionFilter},
        sort: {type: GraphQLSubscriptionSort, defaultValue: SubscriptionSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      async resolve(
        root,
        {filter, sort, order, after, before, first, skip, last},
        {authenticate, dbAdapter}
      ) {
        const {roles} = authenticate()
        authorise(CanGetSubscriptions, roles)
        return await dbAdapter.subscription.getSubscriptions({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last, skip)
        })
      }
    },

    subscriptionsAsCsv: {
      type: GraphQLString,
      args: {filter: {type: GraphQLSubscriptionFilter}},
      async resolve(root, {filter}, {dbAdapter, authenticate}) {
        const {roles} = authenticate()
        authorise(CanGetSubscriptions, roles)
        authorise(CanGetUsers, roles)

        const subscriptions: Subscription[] = []
        const users: User[] = []

        let hasMore = true
        let afterCursor
        while (hasMore) {
          const listResult: ConnectionResult<Subscription> = await dbAdapter.subscription.getSubscriptions(
            {
              filter,
              limit: Limit(100),
              sort: SubscriptionSort.ModifiedAt,
              cursor: InputCursor(afterCursor ?? undefined),
              order: SortOrder.Descending
            }
          )
          subscriptions.push(...listResult.nodes)
          hasMore = listResult.pageInfo.hasNextPage
          afterCursor = listResult.pageInfo.endCursor
        }

        hasMore = true
        afterCursor = undefined

        while (hasMore) {
          const listResult: ConnectionResult<User> = await dbAdapter.user.getUsers({
            cursor: InputCursor(afterCursor ?? undefined),
            filter: {},
            limit: Limit(100),
            sort: UserSort.ModifiedAt,
            order: SortOrder.Descending
          })
          users.push(...listResult.nodes)
          hasMore = listResult.pageInfo.hasNextPage
          afterCursor = listResult.pageInfo.endCursor
        }

        return mapSubscriptionsAsCsv(users, subscriptions)
      }
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
      resolve(root, {}, {authenticate}) {
        const {roles} = authenticate()
        authorise(CanGetPermissions, roles)

        return AllPermissions
      }
    },

    // Token
    // =====

    tokens: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLToken))),
      resolve(root, args, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.token.getTokens()
      }
    },

    // Navigation
    // ==========

    navigation: {
      type: GraphQLNavigation,
      args: {id: {type: GraphQLID}, key: {type: GraphQLID}},
      resolve(root, {id, key}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetNavigation, roles)

        if ((id == null && key == null) || (id != null && key != null)) {
          throw new UserInputError('You must provide either `id` or `key`.')
        }

        return id ? loaders.navigationByID.load(id) : loaders.navigationByKey.load(key)
      }
    },

    navigations: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLNavigation))),
      resolve(root, args, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetNavigations, roles)

        return dbAdapter.navigation.getNavigations()
      }
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
      resolve: async (
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
        sort: {type: GraphQLArticleSort, defaultValue: ArticleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending},
        peerFilter: {type: GraphQLString}
      },

      resolve: (root, {sort, order, after, peerFilter}, context, info) =>
        getAdminPeerArticles(sort, order, peerFilter, after, context, info)
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
        filter: {type: GraphQLArticleFilter},
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
      resolve(root, {id, slug}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetMemberPlan, roles)

        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id ? loaders.memberPlansByID.load(id) : loaders.memberPlansBySlug.load(slug)
      }
    },

    memberPlans: {
      type: GraphQLNonNull(GraphQLMemberPlanConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLMemberPlanFilter},
        sort: {type: GraphQLMemberPlanSort, defaultValue: MemberPlanSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetMemberPlans, roles)

        return dbAdapter.memberPlan.getMemberPlans({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // PaymentMethod
    // ======

    paymentMethod: {
      type: GraphQLPaymentMethod,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetPaymentMethod, roles)

        return loaders.paymentMethodsByID.load(id)
      }
    },

    paymentMethods: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentMethod))),
      resolve(root, {}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetPaymentMethods, roles)

        return dbAdapter.paymentMethod.getPaymentMethods()
      }
    },

    paymentProviders: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPaymentProvider))),
      resolve(root, {}, {authenticate, paymentProviders}) {
        const {roles} = authenticate()
        authorise(CanGetPaymentProviders, roles)

        return paymentProviders.map(paymentProvider => ({
          id: paymentProvider.id,
          name: paymentProvider.name
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
      resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetPayment, roles)

        return loaders.paymentsByID.load(id)
      }
    },

    payments: {
      type: GraphQLNonNull(GraphQLPaymentConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLPaymentFilter},
        sort: {type: GraphQLPaymentSort, defaultValue: PaymentSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetPayments, roles)

        return dbAdapter.payment.getPayments({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    }
  }
})
