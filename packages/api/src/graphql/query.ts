import {GraphQLObjectType, GraphQLList, GraphQLNonNull, GraphQLInt, GraphQLID} from 'graphql'
import {Context} from '../context'
import {GraphQLUser, GraphQLSession} from './session'

import {
  GraphQLArticleConnection,
  GraphQLArticleSort,
  GraphQLArticleFilter,
  GraphQLPublishedArticleConnection,
  GraphQLPublishedArticleSort,
  GraphQLArticle,
  GraphQLPublishedArticle,
  GraphQLPublishedArticleFilter
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
import {UserInputError} from 'apollo-server'
import {GraphQLNavigation} from './navigation'
import {GraphQLSlug} from './slug'
import {
  GraphQLPage,
  GraphQLPublishedPage,
  GraphQLPageConnection,
  GraphQLPageFilter,
  GraphQLPageSort,
  GraphQLPublishedPageConnection,
  GraphQLPublishedPageFilter,
  GraphQLPublishedPageSort
} from './page'
import {PageSort} from '../db/page'

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

    // Navigation
    // ==========

    navigation: {
      type: GraphQLNavigation,
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
        authenticate()

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
        authenticate()

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
        authenticate()
        return loaders.articles.load(id)
      }
    },

    publishedArticle: {
      type: GraphQLPublishedArticle,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate, loaders}) {
        return loaders.publishedArticles.load(id)
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
        authenticate()

        return dbAdapter.getArticles({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    publishedArticles: {
      type: GraphQLNonNull(GraphQLPublishedArticleConnection),
      args: {
        after: {type: GraphQLID},
        before: {type: GraphQLID},
        first: {type: GraphQLInt},
        last: {type: GraphQLInt},
        filter: {type: GraphQLPublishedArticleFilter},
        sort: {type: GraphQLPublishedArticleSort, defaultValue: ArticleSort.PublishedAt},
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
      type: GraphQLPage,
      args: {id: {type: GraphQLID}},
      resolve(root, {id}, {authenticate, loaders}) {
        authenticate()
        return loaders.pages.load(id)
      }
    },

    publishedPage: {
      type: GraphQLPublishedPage,
      args: {id: {type: GraphQLID}, slug: {type: GraphQLSlug}},
      resolve(root, {id, slug}, {authenticate, loaders}) {
        if ((id == null && slug == null) || (id != null && slug != null)) {
          throw new UserInputError('You must provide either `id` or `slug`.')
        }

        return id ? loaders.publishedPagesByID.load(id) : loaders.publishedPagesBySlug.load(slug)
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
        authenticate()

        return dbAdapter.getPages({
          filter,
          sort,
          order,
          cursor: InputCursor(after, before),
          limit: Limit(first, last)
        })
      }
    },

    publishedPages: {
      type: GraphQLNonNull(GraphQLPublishedPageConnection),
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
