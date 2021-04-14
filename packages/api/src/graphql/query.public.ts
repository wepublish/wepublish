import {
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString
} from 'graphql'
import {Context} from '../context'
import {GraphQLPeer, GraphQLPeerProfile} from './peer'
import {GraphQLSlug} from './slug'
import {UserInputError} from 'apollo-server-express'
import {GraphQLPublicNavigation} from './navigation'
import {
  GraphQLAuthor,
  GraphQLAuthorConnection,
  GraphQLAuthorFilter,
  GraphQLAuthorSort
} from './author'
import {AuthorSort} from '../db/author'
import {GraphQLSortOrder} from './common'
import {InputCursor, Limit, SortOrder} from '../db/common'
import {
  GraphQLPublicArticle,
  GraphQLPublicArticleConnection,
  GraphQLPublicArticleFilter,
  GraphQLPublicArticleSort
} from './article'
import {SessionType} from '../db/session'
import {ArticleSort, PublicArticle} from '../db/article'
import {delegateToPeerSchema} from '../utility'
import {
  GraphQLPublicPage,
  GraphQLPublicPageConnection,
  GraphQLPublishedPageFilter,
  GraphQLPublishedPageSort
} from './page'
import {PageSort} from '../db/page'
import {
  GraphQLMemberPlanFilter,
  GraphQLMemberPlanSort,
  GraphQLPublicMemberPlanConnection
} from './memberPlan'
import {MemberPlanSort} from '../db/memberPlan'
import {GraphQLPublicUser} from './user'
import {GraphQLPublicInvoice} from './invoice'
import {GraphQLAuthProvider} from './auth'
import {logger} from '../server'

export function getGraphQLPublicQuery<TSource, TContext, TArgs>(
  content?: GraphQLObjectType<any, Context>
) {
  let contentFields = {}
  if (content) {
    contentFields = {
      content: {
        type: GraphQLNonNull(content),
        resolve: () => {
          return {}
        }
      }
    }
  }

  return new GraphQLObjectType<undefined, Context>({
    name: 'Query',
    fields: {
      ...contentFields,

      // Settings
      // ========

      peerProfile: {
        type: GraphQLNonNull(GraphQLPeerProfile),
        async resolve(root, args, {hostURL, websiteURL, dbAdapter}) {
          return {...(await dbAdapter.peer.getPeerProfile()), hostURL, websiteURL}
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
        args: {
          id: {type: GraphQLID},
          slug: {type: GraphQLSlug},
          token: {type: GraphQLString}
        },
        async resolve(root, {id, slug, token}, {session, loaders, dbAdapter, verifyJWT}) {
          let article = id ? await loaders.publicArticles.load(id) : null

          if (!article && slug) {
            article = await dbAdapter.article.getPublishedArticleBySlug(slug)
          }

          if (!article && token) {
            try {
              const articleId = verifyJWT(token)
              const privateArticle = await loaders.articles.load(articleId)

              article = privateArticle?.draft
                ? ({
                    id: privateArticle.id,
                    shared: privateArticle.shared,
                    updatedAt: new Date(),
                    publishedAt: new Date(),
                    ...privateArticle.draft
                  } as PublicArticle)
                : null
            } catch (error) {
              logger('graphql-query').warn(error, 'Error while verifying token with article id')
            }
          }

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
      },

      // Auth
      // =======

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

      // User
      // ====

      me: {
        type: GraphQLPublicUser,
        resolve(root, args, {session}) {
          return session?.type === SessionType.User ? session.user : null
        }
      },

      invoices: {
        type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicInvoice))),
        resolve(root, {}, {authenticateUser, dbAdapter}) {
          const {user} = authenticateUser()

          return dbAdapter.invoice.getInvoicesByUserID(user.id)
        }
      },

      memberPlans: {
        type: GraphQLNonNull(GraphQLPublicMemberPlanConnection),
        args: {
          after: {type: GraphQLID},
          before: {type: GraphQLID},
          first: {type: GraphQLInt},
          last: {type: GraphQLInt},
          filter: {type: GraphQLMemberPlanFilter},
          sort: {type: GraphQLMemberPlanSort, defaultValue: MemberPlanSort.CreatedAt},
          order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
        },
        resolve(root, {filter, sort, order, after, before, first, last}, {dbAdapter}) {
          return dbAdapter.memberPlan.getActiveMemberPlans({
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
}
