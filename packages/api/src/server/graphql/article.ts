import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

import {GraphQLPeer} from './peer'
import {GraphQLDateRange} from './dateRange'
import {ArticleVersionState} from '../../shared'
import {Context} from '../context'
import {AdapterArticle} from '../adapter'

export const GraphQLArticleVersionState = new GraphQLEnumType({
  name: 'ArticleVersionState',
  values: {
    DRAFT: {value: ArticleVersionState.Draft},
    REVIEW: {value: ArticleVersionState.Review},
    PUBLISHED: {value: ArticleVersionState.Published}
  }
})

export const GraphQLArticleInput = new GraphQLInputObjectType({
  name: 'ArticleInput',
  fields: {
    state: {
      type: GraphQLNonNull(GraphQLArticleVersionState)
    },
    title: {
      type: GraphQLNonNull(GraphQLString)
    },
    lead: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})

export const GraphQLArticlePageInfo = new GraphQLObjectType({
  name: 'DatePageInfo',
  fields: {
    publishedBetween: {type: GraphQLDateRange},
    updatedBetween: {type: GraphQLDateRange},
    createdBetween: {type: GraphQLDateRange}
  }
})

export const GraphQLArticleVersion = new GraphQLObjectType({
  name: 'ArticleVersion',

  fields: {
    version: {type: GraphQLInt},

    createdAt: {type: GraphQLDateTime},
    updatedAt: {type: GraphQLDateTime},

    title: {type: GraphQLString},
    lead: {type: GraphQLString}
  }
})

export const GraphQLArticle: GraphQLObjectType = new GraphQLObjectType({
  name: 'Article',

  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLDateTime},
    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    latest: {
      type: GraphQLArticleVersion,
      resolve(root: AdapterArticle, _args, context: Context) {
        return context.adapter.getArticleVersion(root.id, root.latestVersion)
      }
    },
    published: {
      type: GraphQLArticleVersion,
      resolve(root: AdapterArticle, _args, context: Context) {
        if (root.publishedVersion == undefined) return undefined
        return context.adapter.getArticleVersion(root.id, root.publishedVersion)
      }
    },
    review: {
      type: GraphQLArticleVersion,
      resolve(root: AdapterArticle, _args, context: Context) {
        if (root.reviewVersion == undefined) return undefined
        return context.adapter.getArticleVersion(root.id, root.reviewVersion)
      }
    },
    draft: {
      type: GraphQLArticleVersion,
      resolve(root: AdapterArticle, _args, context: Context) {
        if (root.draftVersion == undefined) return undefined
        return context.adapter.getArticleVersion(root.id, root.draftVersion)
      }
    },
    versions: {
      type: new GraphQLList(GraphQLArticleVersion),
      resolve(root: AdapterArticle, _args, context: Context) {
        return context.adapter.getArticleVersions(root.id)
      }
    },

    peer: {type: GraphQLPeer}
  })
})

export const GraphQLArticleConnection: GraphQLObjectType = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: new GraphQLList(GraphQLArticle)},
    pageInfo: {
      type: GraphQLArticlePageInfo
    }
  }
})
