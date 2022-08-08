import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  Kind
} from 'graphql'

import {
  delegateToSchema,
  ExtractField,
  introspectSchema,
  makeRemoteExecutableSchema,
  WrapQuery
} from 'graphql-tools'

import {UserInputError} from 'apollo-server-express'

import {Context, createFetcher} from '../context'

import {GraphQLSession} from './session'
import {GraphQLAuthProvider, GraphQLJWTToken} from './auth'

import {
  GraphQLArticle,
  GraphQLArticleConnection,
  GraphQLArticleFilter,
  GraphQLArticleSort,
  GraphQLPeerArticleConnection
} from './article'

import {ConnectionResult, InputCursor, Limit, SortOrder} from '../db/common'
import {ArticleSort, PeerArticle} from '../db/article'
import {GraphQLSortOrder} from './common'
import {GraphQLImage, GraphQLImageConnection, GraphQLImageFilter, GraphQLImageSort} from './image'
import {ImageSort} from '../db/image'

import {
  GraphQLAuthor,
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort
} from './author'

import {AuthorSort} from '../db/author'
import {UserSort} from '../db/user'
import {GraphQLNavigation} from './navigation'
import {GraphQLSlug} from './slug'

import {GraphQLPage, GraphQLPageConnection, GraphQLPageFilter, GraphQLPageSort} from './page'

import {PageSort} from '../db/page'

import {SessionType} from '../db/session'
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {GraphQLToken} from './token'
import {
  base64Decode,
  base64Encode,
  delegateToPeerSchema,
  mapSubscriptionsAsCsv,
  markResultAsProxied
} from '../utility'

import {
  AllPermissions,
  authorise,
  CanCreatePeer,
  CanGetArticle,
  CanGetArticlePreviewLink,
  CanGetArticles,
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
  CanGetPeerArticles,
  CanGetPeerProfile,
  CanGetPeers,
  CanGetPermissions,
  CanGetSettings,
  CanGetSharedArticle,
  CanGetSharedArticles,
  CanGetSubscription,
  CanGetSubscriptions,
  CanGetUser,
  CanGetUserRole,
  CanGetUserRoles,
  CanGetUsers,
  CanLoginAsOtherUser,
  isAuthorised
} from './permissions'
import {GraphQLUser, GraphQLUserConnection, GraphQLUserFilter, GraphQLUserSort} from './user'
import {
  GraphQLPermission,
  GraphQLUserRole,
  GraphQLUserRoleConnection,
  GraphQLUserRoleFilter,
  GraphQLUserRoleSort
} from './userRole'
import {UserRoleSort} from '../db/userRole'

import {
  DisabledPeerError,
  GivenTokeExpiryToLongError,
  NotAuthorisedError,
  NotFound,
  PeerTokenInvalidError,
  UserIdNotFound
} from '../error'
import {GraphQLCommentConnection, GraphQLCommentFilter, GraphQLCommentSort} from './comment'
import {
  GraphQLMemberPlan,
  GraphQLMemberPlanConnection,
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort
} from './memberPlan'
import {MemberPlanSort} from '../db/memberPlan'
import {GraphQLPaymentMethod, GraphQLPaymentProvider} from './paymentMethod'
import {
  GraphQLInvoice,
  GraphQLInvoiceConnection,
  GraphQLinvoiceFilter,
  GraphQLInvoiceSort
} from './invoice'
import {InvoiceSort} from '../db/invoice'
import {
  GraphQLPayment,
  GraphQLPaymentConnection,
  GraphQLPaymentFilter,
  GraphQLPaymentSort
} from './payment'
import {PaymentSort} from '../db/payment'
import {CommentSort} from '../db/comment'
import {Subscription, SubscriptionJoins, SubscriptionSort} from '../db/subscription'
import {
  GraphQLSubscription,
  GraphQLSubscriptionConnection,
  GraphQLSubscriptionFilter,
  GraphQLSubscriptionSort
} from './subscription'
import {GraphQLSetting} from './setting'
import {SettingName} from '../db/setting'

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
      async resolve(root, {hostURL, token}, {authenticate, dbAdapter}, info) {
        const {roles} = authenticate()
        authorise(CanCreatePeer, roles)
        const link = new URL('/admin', hostURL)
        const peerTimeout =
          ((await dbAdapter.setting.getSetting(SettingName.PEERING_TIMEOUT_MS))?.value as number) ??
          parseInt(process.env.PEERING_TIMEOUT_IN_MS as string)
        if (!peerTimeout) throw new Error('No value set for PEERING_TIMEOUT_IN_MS')

        const fetcher = await createFetcher(link.toString(), token, peerTimeout)
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

    createJWTForUser: {
      type: GraphQLJWTToken,
      args: {
        userId: {type: GraphQLNonNull(GraphQLString)},
        expiresInMinutes: {type: GraphQLNonNull(GraphQLInt)}
      },
      async resolve(
        root,
        {userId, expiresInMinutes},
        {authenticate, generateJWT, dbAdapter},
        info
      ) {
        const THIRTY_DAYS_IN_MIN = 30 * 24 * 60
        const {roles} = authenticate()
        authorise(CanLoginAsOtherUser, roles)
        if (expiresInMinutes > THIRTY_DAYS_IN_MIN) throw new GivenTokeExpiryToLongError()

        const user = await dbAdapter.user.getUserByID(userId)
        if (!user) throw new UserIdNotFound()

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
      async resolve(root, {id}, {authenticate, dbAdapter, loaders}) {
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
      resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetUser, roles)

        if (id == null) {
          throw new UserInputError('You must provide `id`')
        }
        return dbAdapter.user.getUserByID(id)
      }
    },

    users: {
      type: GraphQLNonNull(GraphQLUserConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        skip: {type: GraphQLInt},
        filter: {type: GraphQLUserFilter},
        sort: {type: GraphQLUserSort, defaultValue: UserSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      async resolve(
        root,
        {filter, sort, order, after, before, first, skip, last},
        {authenticate, dbAdapter}
      ) {
        const {roles} = authenticate()
        authorise(CanGetUsers, roles)

        return await dbAdapter.user.getUsers({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last, skip)
        })
      }
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
      args: {
        filter: {type: GraphQLSubscriptionFilter}
      },
      async resolve(root, {filter}, {dbAdapter, authenticate}) {
        const {roles} = authenticate()
        authorise(CanGetSubscriptions, roles)
        authorise(CanGetUsers, roles)

        const subscriptions: Subscription[] = []
        const joins: SubscriptionJoins = {
          joinMemberPlan: true,
          joinPaymentMethod: true,
          joinUser: true
        }

        let hasMore = true
        let afterCursor
        while (hasMore) {
          const listResult: ConnectionResult<Subscription> = await dbAdapter.subscription.getSubscriptions(
            {
              filter,
              joins,
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
        return mapSubscriptionsAsCsv(subscriptions)
      }
    },

    // UserRole
    // ========

    userRole: {
      type: GraphQLUserRole,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetUserRole, roles)

        if (id == null) {
          throw new UserInputError('You must provide `id`')
        }
        return dbAdapter.userRole.getUserRoleByID(id)
      }
    },

    userRoles: {
      type: GraphQLNonNull(GraphQLUserRoleConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLUserRoleFilter},
        sort: {type: GraphQLUserRoleSort, defaultValue: UserRoleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetUserRoles, roles)

        return dbAdapter.userRole.getUserRoles({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
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
      resolve(root, {id, slug}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetAuthor, roles)

        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id ? loaders.authorsByID.load(id) : loaders.authorsBySlug.load(slug)
      }
    },

    authors: {
      type: GraphQLNonNull(GraphQLAuthorConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        skip: {type: GraphQLInt},
        filter: {type: GraphQLAuthorFilter},
        sort: {type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, skip, last},
        {authenticate, dbAdapter}
      ) {
        const {roles} = authenticate()
        authorise(CanGetAuthors, roles)

        return dbAdapter.author.getAuthors({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last, skip)
        })
      }
    },

    // Image
    // =====

    image: {
      type: GraphQLImage,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetImage, roles)
        return loaders.images.load(id)
      }
    },

    images: {
      type: GraphQLNonNull(GraphQLImageConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        skip: {type: GraphQLInt},
        filter: {type: GraphQLImageFilter},
        sort: {type: GraphQLImageSort, defaultValue: ImageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, skip, last},
        {authenticate, dbAdapter}
      ) {
        const {roles} = authenticate()
        authorise(CanGetImages, roles)

        return dbAdapter.image.getImages({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last, skip)
        })
      }
    },

    // Comments
    // =======

    comments: {
      type: GraphQLNonNull(GraphQLCommentConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        skip: {type: GraphQLInt},
        filter: {type: GraphQLCommentFilter},
        sort: {type: GraphQLCommentSort, defaultValue: CommentSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      async resolve(
        root,
        {filter, sort, order, after, before, first, last, skip},
        {authenticate, dbAdapter}
      ) {
        const {roles} = authenticate()

        const canGetComments = isAuthorised(CanGetComments, roles)

        if (canGetComments) {
          return await dbAdapter.comment.getComments({
            filter,
            sort,
            order,
            cursor: InputCursor(after, before),
            limit: Limit(first, last, skip)
          })
        } else {
          throw new NotAuthorisedError()
        }
      }
    },

    // Article
    // =======

    article: {
      type: GraphQLArticle,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()

        const canGetArticle = isAuthorised(CanGetArticle, roles)
        const canGetSharedArticle = isAuthorised(CanGetSharedArticle, roles)
        if (canGetArticle || canGetSharedArticle) {
          const article = await loaders.articles.load(id)

          if (canGetArticle) {
            return article
          } else {
            return article?.shared ? article : null
          }
        } else {
          throw new NotAuthorisedError()
        }
      }
    },

    articles: {
      type: GraphQLNonNull(GraphQLArticleConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        skip: {type: GraphQLInt},
        filter: {type: GraphQLArticleFilter},
        sort: {type: GraphQLArticleSort, defaultValue: ArticleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, skip, last},
        {authenticate, dbAdapter}
      ) {
        const {roles} = authenticate()

        const canGetArticles = isAuthorised(CanGetArticles, roles)
        const canGetSharedArticles = isAuthorised(CanGetSharedArticles, roles)

        if (canGetArticles || canGetSharedArticles) {
          return dbAdapter.article.getArticles({
            filter: {...filter, shared: !canGetArticles ? true : undefined},
            sort,
            order,
            cursor: InputCursor(after, before),
            limit: Limit(first, last, skip)
          })
        } else {
          throw new NotAuthorisedError()
        }
      }
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
        after: {type: GraphQLID},
        first: {type: GraphQLInt},
        filter: {type: GraphQLArticleFilter},
        sort: {type: GraphQLArticleSort, defaultValue: ArticleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending},
        peerFilter: {type: GraphQLString},
        last: {type: GraphQLInt},
        skip: {type: GraphQLInt}
      },

      async resolve(
        root,
        {filter, sort, order, after, first, peerFilter, last, skip},
        context,
        info
      ) {
        const {authenticate, loaders, dbAdapter} = context
        const {roles} = authenticate()

        authorise(CanGetPeerArticles, roles)

        after = after ? JSON.parse(base64Decode(after)) : null

        const peers = (await dbAdapter.peer.getPeers())
          .filter(peer => (peerFilter ? peer.name === peerFilter : true))
          .filter(peer => !peer.isDisabled)

        for (const peer of peers) {
          // Prime loader cache so we don't need to refetch inside `delegateToPeerSchema`.
          loaders.peer.prime(peer.id, peer)
        }

        const articles = await Promise.all(
          peers.map(peer => {
            try {
              if (after && after[peer.id] == null) return null

              return delegateToPeerSchema(peer.id, true, context, {
                info,
                fieldName: 'articles',
                args: {after: after ? after[peer.id] : undefined},
                transforms: [
                  new ExtractField({
                    from: ['articles', 'nodes', 'article'],
                    to: ['articles', 'nodes']
                  }),
                  new WrapQuery(
                    ['articles', 'nodes', 'article'],
                    subtree => ({
                      kind: Kind.SELECTION_SET,
                      selections: [
                        ...subtree.selections,
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'id'}
                        },
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'latest'},
                          selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [
                              {
                                kind: Kind.FIELD,
                                name: {kind: Kind.NAME, value: 'updatedAt'}
                              },
                              {
                                kind: Kind.FIELD,
                                name: {kind: Kind.NAME, value: 'publishAt'}
                              },
                              {
                                kind: Kind.FIELD,
                                name: {kind: Kind.NAME, value: 'publishedAt'}
                              }
                            ]
                          }
                        },
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'modifiedAt'}
                        },
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'createdAt'}
                        }
                      ]
                    }),
                    result => result
                  ),
                  new WrapQuery(
                    ['articles'],
                    subtree => ({
                      kind: Kind.SELECTION_SET,
                      selections: [
                        ...subtree.selections,
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'pageInfo'},
                          selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [
                              {
                                kind: Kind.FIELD,
                                name: {kind: Kind.NAME, value: 'endCursor'}
                              },
                              {
                                kind: Kind.FIELD,
                                name: {kind: Kind.NAME, value: 'hasNextPage'}
                              }
                            ]
                          }
                        },
                        {
                          kind: Kind.FIELD,
                          name: {kind: Kind.NAME, value: 'totalCount'}
                        }
                      ]
                    }),
                    result => result
                  )
                ]
              })
            } catch (err) {
              return null
            }
          })
        )

        const totalCount = articles.reduce((prev, result) => prev + (result?.totalCount ?? 0), 0)
        const cursors = Object.fromEntries(
          articles.map((result, index) => [peers[index].id, result?.pageInfo.endCursor ?? null])
        )

        const hasNextPage = articles.reduce(
          (prev, result) => prev || (result?.pageInfo.hasNextPage ?? false),
          false
        )

        const peerArticles = articles.flatMap<PeerArticle & {article: any}>((result, index) => {
          const peer = peers[index]

          return result?.nodes.map((article: any) => ({peerID: peer.id, article})) ?? []
        })

        switch (sort) {
          case ArticleSort.CreatedAt:
            peerArticles.sort(
              (a, b) =>
                new Date(b.article.createdAt).getTime() - new Date(a.article.createdAt).getTime()
            )
            break

          case ArticleSort.ModifiedAt:
            peerArticles.sort(
              (a, b) =>
                new Date(b.article.modifiedAt).getTime() - new Date(a.article.modifiedAt).getTime()
            )
            break

          case ArticleSort.PublishAt:
            peerArticles.sort(
              (a, b) =>
                new Date(b.article.latest.publishAt).getTime() -
                new Date(a.article.latest.publishAt).getTime()
            )
            break

          case ArticleSort.PublishedAt:
            peerArticles.sort(
              (a, b) =>
                new Date(b.article.latest.publishedAt).getTime() -
                new Date(a.article.latest.publishedAt).getTime()
            )
            break

          case ArticleSort.UpdatedAt:
            peerArticles.sort(
              (a, b) =>
                new Date(b.article.latest.updatedAt).getTime() -
                new Date(a.article.latest.updatedAt).getTime()
            )
            break
        }

        if (order === SortOrder.Ascending) {
          peerArticles.reverse()
        }

        return {
          nodes: peerArticles,
          totalCount: totalCount,
          pageInfo: {
            endCursor: base64Encode(JSON.stringify(cursors)),
            hasNextPage: hasNextPage
          }
        }
      }
    },

    articlePreviewLink: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}, hours: {type: GraphQLNonNull(GraphQLInt)}},
      async resolve(root, {id, hours}, {authenticate, loaders, urlAdapter, generateJWT}) {
        const {roles} = authenticate()
        authorise(CanGetArticlePreviewLink, roles)

        const article = await loaders.articles.load(id)

        if (!article) throw new NotFound('article', id)

        if (!article.draft) throw new UserInputError('Article needs to have a draft')

        const token = generateJWT({
          id: article.id,
          expiresInMinutes: hours * 60
        })

        return urlAdapter.getArticlePreviewURL(token)
      }
    },

    // Page
    // ====

    page: {
      type: GraphQLPage,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetPage, roles)
        return loaders.pages.load(id)
      }
    },

    pages: {
      type: GraphQLNonNull(GraphQLPageConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLPageFilter},
        skip: {type: GraphQLInt},
        sort: {type: GraphQLPageSort, defaultValue: PageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, last, skip},
        {authenticate, dbAdapter}
      ) {
        const {roles} = authenticate()
        authorise(CanGetPages, roles)

        return dbAdapter.page.getPages({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last, skip)
        })
      }
    },

    pagePreviewLink: {
      type: GraphQLString,
      args: {id: {type: GraphQLNonNull(GraphQLID)}, hours: {type: GraphQLNonNull(GraphQLInt)}},
      async resolve(root, {id, hours}, {authenticate, loaders, urlAdapter, generateJWT}) {
        const {roles} = authenticate()
        authorise(CanGetPagePreviewLink, roles)

        const page = await loaders.pages.load(id)

        if (!page) throw new NotFound('page', id)

        if (!page.draft) throw new UserInputError('Page needs to have a draft')

        const token = generateJWT({
          id: page.id,
          expiresInMinutes: hours * 60
        })

        return urlAdapter.getPagePreviewURL(token)
      }
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
      resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetInvoice, roles)

        return loaders.invoicesByID.load(id)
      }
    },

    invoices: {
      type: GraphQLNonNull(GraphQLInvoiceConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLinvoiceFilter},
        sort: {type: GraphQLInvoiceSort, defaultValue: InvoiceSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetInvoices, roles)

        return dbAdapter.invoice.getInvoices({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
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
    },
    // Setting
    // ======

    setting: {
      type: GraphQLSetting,
      args: {name: {type: GraphQLString}},
      resolve(root, {name}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetSettings, roles)
        if (!name) throw new UserInputError('You must provide setting `name`.')
        return dbAdapter.setting.getSetting(name)
      }
    },

    settings: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSetting))),
      resolve(root, {}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetSettings, roles)
        return dbAdapter.setting.getSettingList()
      }
    }
  }
})
