import {
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLID,
  GraphQLString
} from 'graphql'
import {Context, Oauth2Provider} from '../context'
import {GraphQLSession} from './session'
import {GraphQLAuthProvider} from './auth'

import {
  GraphQLArticleConnection,
  GraphQLArticleSort,
  GraphQLArticleFilter,
  GraphQLPublicArticleConnection,
  GraphQLPublicArticleSort,
  GraphQLArticle,
  GraphQLPublicArticle,
  GraphQLPublicArticleFilter
} from './article'

import {InputCursor, Limit} from '../db/common'
import {ArticleSort} from '../db/article'
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
import {UserSort} from '../db/user'
import {UserInputError} from 'apollo-server-express'
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
import {Client, Issuer} from 'openid-client'
import {
  AllPermissions,
  authorise,
  CanGetArticle,
  CanGetArticles,
  CanGetAuthor,
  CanGetAuthors,
  CanGetImage,
  CanGetImages,
  CanGetNavigation,
  CanGetPage,
  CanGetPages,
  CanGetPermission,
  CanGetPermissions,
  CanGetUser,
  CanGetUserRole,
  CanGetUserRoles,
  CanGetUsers
} from './permissions'
import {GraphQLUserConnection, GraphQLUserFilter, GraphQLUserSort, GraphQLUser} from './user'
import {
  GraphQLPermission,
  GraphQLUserRole,
  GraphQLUserRoleConnection,
  GraphQLUserRoleFilter,
  GraphQLUserRoleSort
} from './userRole'
import {UserRoleSort} from '../db/userRole'

export const GraphQLQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {
    // User
    // ====

    me: {
      type: GraphQLUser,
      resolve(root, args, {session}) {
        return session?.user
      }
    },

    // Session
    // =======

    sessions: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLSession))),
      resolve(root, args, {authenticate, dbAdapter}) {
        const session = authenticate()
        return dbAdapter.getSessionsForUser(session.user)
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
        return dbAdapter.getUserByID(id)
      }
    },

    users: {
      type: GraphQLNonNull(GraphQLUserConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLUserFilter},
        sort: {type: GraphQLUserSort, defaultValue: UserSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetUsers, roles)

        return dbAdapter.getUsers({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
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
        return dbAdapter.getUserRoleByID(id)
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

        return dbAdapter.getUserRoles({
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

    permission: {
      type: GraphQLPermission,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate}) {
        const {roles} = authenticate()
        authorise(CanGetPermission, roles)

        if (id == null) {
          throw new Error('You must provide `id`')
        }
        return AllPermissions.find(permission => permission.id === id)
      }
    },

    permissions: {
      type: GraphQLList(GraphQLNonNull(GraphQLPermission)),
      args: {},
      resolve(root, {}, {authenticate}) {
        const {roles} = authenticate()
        authorise(CanGetPermissions, roles)

        return AllPermissions
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
        filter: {type: GraphQLAuthorFilter},
        sort: {type: GraphQLAuthorSort, defaultValue: AuthorSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetAuthors, roles)

        return dbAdapter.getAuthors({
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
        filter: {type: GraphQLImageFilter},
        sort: {type: GraphQLImageSort, defaultValue: ImageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetImages, roles)

        return dbAdapter.getImages({
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
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate, loaders}) {
        const {roles} = authenticate()
        authorise(CanGetArticle, roles)
        return loaders.articles.load(id)
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
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetArticles, roles)

        return dbAdapter.getArticles({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Page
    // =======

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
        sort: {type: GraphQLPageSort, defaultValue: PageSort.ModifiedAt},
        order: {type: GraphQLSortOrder, defaultValue: SortOrder.Descending}
      },
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        const {roles} = authenticate()
        authorise(CanGetPages, roles)

        return dbAdapter.getPages({
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
    // Navigation
    // ==========

    navigation: {
      type: GraphQLPublicNavigation,
      args: {id: {type: GraphQLID}, key: {type: GraphQLID}},
      resolve(root, {id, key}, {authenticate, loaders}) {
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
      resolve(root, {id, slug}, {authenticate, loaders}) {
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
      resolve(root, {filter, sort, order, after, before, first, last}, {authenticate, dbAdapter}) {
        return dbAdapter.getAuthors({
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
      resolve(root, {id}, {authenticate, loaders}) {
        return loaders.publicArticles.load(id)
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
        return dbAdapter.getPublishedArticles({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    // Page
    // =======

    page: {
      type: GraphQLPublicPage,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve(root, {id, slug}, {authenticate, loaders}) {
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
        return dbAdapter.getPublishedPages({
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
