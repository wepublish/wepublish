import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLID,
  GraphQLString,
  Kind
} from 'graphql'

import {Client, Issuer} from 'openid-client'
import {UserInputError} from 'apollo-server-express'

import {Context, Oauth2Provider} from '../context'

import {GraphQLUser, GraphQLSession} from './session'
import {GraphQLAuthProvider} from './auth'

import {
  GraphQLArticleConnection,
  GraphQLArticleSort,
  GraphQLArticleFilter,
  GraphQLPublicArticleConnection,
  GraphQLPublicArticleSort,
  GraphQLArticle,
  GraphQLPublicArticle,
  GraphQLPublicArticleFilter,
  GraphQLPeerArticleConnection
} from './article'

import {InputCursor, Limit} from '../db/common'
import {ArticleSort, PeerArticle} from '../db/article'
import {GraphQLSortOrder} from './common'
import {SortOrder} from '../db/common'
import {GraphQLImageConnection, GraphQLImageFilter, GraphQLImageSort, GraphQLImage} from './image'
import {ImageSort} from '../db/image'

import {
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort,
  GraphQLAuthor
} from './author'

import {AuthorSort} from '../db/author'
import {GraphQLNavigation, GraphQLPublicNavigation} from './navigation'
import {GraphQLSlug} from './slug'

import {
  GraphQLPage,
  GraphQLPublicPage,
  GraphQLPageConnection,
  GraphQLPageFilter,
  GraphQLPageSort,
  GraphQLPublicPageConnection,
  GraphQLPublishedPageFilter,
  GraphQLPublishedPageSort
} from './page'

import {PageSort} from '../db/page'

import {SessionType} from '../db/session'
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {GraphQLToken} from './token'
import {delegateToPeerSchema, base64Encode, base64Decode} from '../utility'
import {WrapQuery, ExtractField} from 'graphql-tools'

export const GraphQLQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // Peering
    // =======

    peerProfile: {
      type: GraphQLNonNull(GraphQLPeerProfile),
      async resolve(root, args, {authenticateTokenOrUser, hostURL, dbAdapter}) {
        authenticateTokenOrUser()
        return {...(await dbAdapter.peer.getPeerProfile()), hostURL}
      }
    },

    peers: {
      type: GraphQLList(GraphQLNonNull(GraphQLPeer)),
      resolve(root, {id}, {authenticateUser, dbAdapter}) {
        authenticateUser()
        return dbAdapter.peer.getPeers()
      }
    },

    peer: {
      type: GraphQLPeer,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      resolve(root, {id}, {authenticateUser, dbAdapter, loaders}) {
        authenticateUser()
        return loaders.peer.load(id)
      }
    },

    // User
    // ====

    me: {
      type: GraphQLUser,
      resolve(root, args, {session}) {
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
      async resolve(root, {redirectUri}, {oauth2Providers}) {
        const clients: {
          name: string
          provider: Oauth2Provider
          client: Client
        }[] = await Promise.all(
          oauth2Providers.map(async provider => {
            const issuer = await Issuer.discover(provider.discoverUrl)
            return {
              name: provider.name,
              provider,
              client: new issuer.Client({
                client_id: provider.clientId,
                client_secret: provider.clientKey,
                redirect_uris: provider.redirectUri,
                response_types: ['code']
              })
            }
          })
        )
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
      resolve(root, {id, key}, {authenticateUser, loaders}) {
        authenticateUser()

        if ((id == null && key == null) || (id != null && key != null)) {
          throw new UserInputError('You must provide either `id` or `key`.')
        }

        return id ? loaders.navigationByID.load(id) : loaders.navigationByKey.load(key)
      }
    },

    // Author
    // ======

    author: {
      type: GraphQLAuthor,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve(root, {id, slug}, {authenticateUser, loaders}) {
        authenticateUser()

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
        filter: {type: GraphQLAuthorFilter},
        sort: {type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, last},
        {authenticateUser, dbAdapter}
      ) {
        authenticateUser()

        return dbAdapter.author.getAuthors({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Image
    // =====

    image: {
      type: GraphQLImage,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticateUser, loaders}) {
        authenticateUser()
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
        filter: {type: GraphQLImageFilter},
        sort: {type: GraphQLImageSort, defaultValue: ImageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, last},
        {authenticateUser, dbAdapter}
      ) {
        authenticateUser()

        return dbAdapter.image.getImages({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Article
    // =======

    article: {
      type: GraphQLArticle,
      args: {id: {type: GraphQLNonNull(GraphQLID)}},
      async resolve(root, {id}, {authenticateTokenOrUser, loaders}) {
        const session = authenticateTokenOrUser()

        const article = await loaders.articles.load(id)
        return session.type === SessionType.Token ? (article?.shared ? article : null) : article
      }
    },

    articles: {
      type: GraphQLNonNull(GraphQLArticleConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLArticleFilter},
        sort: {type: GraphQLArticleSort, defaultValue: ArticleSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, last},
        {authenticateTokenOrUser, dbAdapter}
      ) {
        const session = authenticateTokenOrUser()

        return dbAdapter.article.getArticles({
          filter: {...filter, shared: session.type === SessionType.Token ? true : undefined},
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Peer Article
    // ============

    peerArticle: {
      type: GraphQLArticle,
      args: {peerID: {type: GraphQLNonNull(GraphQLID)}, id: {type: GraphQLNonNull(GraphQLID)}},
      resolve(root, {peerID, id}, context, info) {
        const {authenticateTokenOrUser} = context

        authenticateTokenOrUser()
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
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      async resolve(root, {filter, sort, order, after, first}, context, info) {
        const {authenticateTokenOrUser, loaders, dbAdapter} = context

        authenticateTokenOrUser()

        after = after ? JSON.parse(base64Decode(after)) : null

        const peers = await dbAdapter.peer.getPeers()

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

    // Page
    // ====

    page: {
      type: GraphQLPage,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticateUser, loaders}) {
        authenticateUser()
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
        sort: {type: GraphQLPageSort, defaultValue: PageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(
        root,
        {filter, sort, order, after, before, first, last},
        {authenticateUser, dbAdapter}
      ) {
        authenticateUser()

        return dbAdapter.page.getPages({
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

export const GraphQLPublicQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // Settings
    // ========

    peerProfile: {
      type: GraphQLNonNull(GraphQLPeerProfile),
      async resolve(root, args, {hostURL, dbAdapter}) {
        return {...(await dbAdapter.peer.getPeerProfile()), hostURL}
      }
    },

    peer: {
      type: GraphQLPeer,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve(root, {id, slug}, {loaders}) {
        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id ? loaders.peer.load(id) : loaders.peerBySlug.load(slug)
      }
    },

    // Navigation
    // ==========

    navigation: {
      type: GraphQLPublicNavigation,
      args: {id: {type: GraphQLID}, key: {type: GraphQLID}},
      resolve(root, {id, key}, {authenticateUser, loaders}) {
        if ((id == null && key == null) || (id != null && key != null)) {
          throw new UserInputError('You must provide either `id` or `key`.')
        }

        return id ? loaders.navigationByID.load(id) : loaders.navigationByKey.load(key)
      }
    },

    // Author
    // ======

    author: {
      type: GraphQLAuthor,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve(root, {id, slug}, {authenticateUser, loaders}) {
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
        filter: {type: GraphQLAuthorFilter},
        sort: {type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
        return dbAdapter.author.getAuthors({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Article
    // =======

    article: {
      type: GraphQLPublicArticle,
      args: {id: {type: GraphQLID}},
      async resolve(root, {id}, {session, loaders}) {
        const article = await loaders.publicArticles.load(id)

        if (session?.type === SessionType.Token) {
          return article?.shared ? article : null
        }

        return article
      }
    },

    articles: {
      type: GraphQLNonNull(GraphQLPublicArticleConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLPublicArticleFilter},
        sort: {type: GraphQLPublicArticleSort, defaultValue: ArticleSort.PublishedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
        return dbAdapter.article.getPublishedArticles({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Peer Article
    // ============

    peerArticle: {
      type: GraphQLPublicArticle,
      args: {
        peerID: {type: GraphQLID},
        peerSlug: {type: GraphQLSlug},
        id: {type: GraphQLNonNull(GraphQLID)}
      },
      async resolve(root, {peerID, peerSlug, id}, context, info) {
        const {loaders} = context

        if ((peerID == null && peerSlug == null) || (peerID != null && peerSlug != null)) {
          throw new UserInputError('You must provide either `peerID` or `peerSlug`.')
        }

        if (peerSlug) {
          const peer = await loaders.peerBySlug.load(peerSlug)

          if (peer) {
            peerID = peer.id
            loaders.peer.prime(peer.id, peer)
          }
        }

        if (!peerID) return null

        return delegateToPeerSchema(peerID, false, context, {
          fieldName: 'article',
          args: {id},
          info
        })
      }
    },

    // Page
    // =======

    page: {
      type: GraphQLPublicPage,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve(root, {id, slug}, {authenticateUser, loaders}) {
        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id ? loaders.publicPagesByID.load(id) : loaders.publicPagesBySlug.load(slug)
      }
    },

    pages: {
      type: GraphQLNonNull(GraphQLPublicPageConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLPublishedPageFilter},
        sort: {type: GraphQLPublishedPageSort, defaultValue: PageSort.PublishedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
        return dbAdapter.page.getPublishedPages({
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
