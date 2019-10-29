import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLUnionType
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

import {GraphQLPeer} from './peer'
import {GraphQLDateRange} from './dateRange'

import {Context} from '../context'
import {AdapterArticle, AdapterArticleVersion} from '../adapter'

import {ArticleVersionState, BlockType} from '../types'

import {
  GraphQLRichTextBlock,
  GraphQLImageBlock,
  GraphQLInputRichTextBlock,
  GraphQLImageGalleryBlock,
  GraphQLFacebookPostBlock,
  GraphQLInstagramPostBlock,
  GraphQLTwitterTweetBlock,
  GraphQLVimeoVideoBlock,
  GraphQLYouTubeVideoBlock,
  GraphQLSoundCloudTrackBlock,
  GraphQLListicleBlock,
  GraphQLLinkPageBreakBlock
} from './blocks'

import {GraphQLImage} from './image'

export const GraphQLInputArticleBlockUnionMap = new GraphQLInputObjectType({
  name: 'InputBlockUnionMap',
  fields: {
    [BlockType.RichText]: {type: GraphQLInputRichTextBlock}
  }
})

export const GraphQLArticleBlock = new GraphQLUnionType({
  name: 'ArticleBlock',
  types: [
    GraphQLRichTextBlock,
    GraphQLImageBlock,
    GraphQLImageGalleryBlock,
    GraphQLFacebookPostBlock,
    GraphQLInstagramPostBlock,
    GraphQLTwitterTweetBlock,
    GraphQLVimeoVideoBlock,
    GraphQLYouTubeVideoBlock,
    GraphQLSoundCloudTrackBlock,
    GraphQLListicleBlock,
    GraphQLLinkPageBreakBlock
  ]
})

export const GraphQLArticleVersionState = new GraphQLEnumType({
  name: 'ArticleVersionState',
  description: 'Current state of the article version.',
  values: {
    DRAFT: {value: ArticleVersionState.Draft},
    DRAFT_REVIEW: {value: ArticleVersionState.DraftReview},
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
    },
    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInputArticleBlockUnionMap)))
    }
  }
})

export const GraphQLArticlePageInfo = new GraphQLObjectType({
  name: 'ArticlePageInfo',
  fields: {
    publishedBetween: {type: GraphQLDateRange},
    updatedBetween: {type: GraphQLDateRange},
    createdBetween: {type: GraphQLDateRange}
  }
})

export const GraphQLAuthor = new GraphQLObjectType({
  name: 'Author',

  fields: () => ({
    id: {type: GraphQLID},
    name: {type: GraphQLString},
    image: {type: GraphQLImage},
    articles: {type: GraphQLArticleConnection}
  })
})

export const GraphQLArticleVersion = new GraphQLObjectType<any, Context>({
  name: 'ArticleVersion',

  fields: {
    version: {type: GraphQLNonNull(GraphQLInt)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},

    slug: {type: GraphQLNonNull(GraphQLString)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLNonNull(GraphQLString)},

    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    authors: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthor)))},

    featuredBlock: {
      type: GraphQLArticleBlock,
      resolve({articleID, version}: AdapterArticleVersion, _args, {adapter}) {
        return adapter.getArticleVersionFeaturedBlock(articleID, version)
      }
    },

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleBlock))),
      resolve({articleID, version}: AdapterArticleVersion, _args, {adapter}) {
        return adapter.getArticleVersionBlocks(articleID, version)
      }
    }
  }
})

// NOTE: Because we have a recursion inside Peer we have to set the type explicitly.
export const GraphQLArticle: GraphQLObjectType = new GraphQLObjectType({
  name: 'Article',

  fields: () => ({
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLDateTime},
    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    published: {
      type: GraphQLArticleVersion,
      resolve(root: AdapterArticle, _args, context: Context) {
        if (root.publishedVersion == undefined) return undefined
        return context.adapter.getArticleVersion(root.id, root.publishedVersion)
      }
    },

    draft: {
      type: GraphQLArticleVersion,
      async resolve(root: AdapterArticle, _args, {adapter, authenticate}: Context) {
        await authenticate()
        if (root.draftVersion == undefined) return undefined

        return adapter.getArticleVersion(root.id, root.draftVersion)
      }
    },

    versions: {
      type: GraphQLList(GraphQLArticleVersion),
      async resolve(root: AdapterArticle, _args, {adapter, authenticate}: Context) {
        await authenticate()
        return adapter.getArticleVersions(root.id)
      }
    },

    peer: {type: GraphQLPeer}
  })
})

export const GraphQLArticleConnection = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: GraphQLList(GraphQLArticle)},
    pageInfo: {
      type: GraphQLArticlePageInfo
    }
  }
})
