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
import {GraphQLStringLiteral} from './stringLiteral'

import {Context} from '../context'
import {AdapterArticle} from '../adapter'

import {ArticleVersionState, BlockType} from '../../shared'

export const GraphQLArticleVersionState = new GraphQLEnumType({
  name: 'ArticleVersionState',
  description: 'Current state of the article version.',
  values: {
    DRAFT: {value: ArticleVersionState.Draft},
    DRAFT_REVIEW: {value: ArticleVersionState.DraftReview},
    PUBLISHED: {value: ArticleVersionState.Published}
  }
})

export const GraphQLStringLiteralFoo = GraphQLStringLiteral(BlockType.Foo)
export const GraphQLStringLiteralBar = GraphQLStringLiteral(BlockType.Bar)

export const GraphQLInputFooBlock = new GraphQLInputObjectType({
  name: 'FooInputBlock',
  fields: {
    foo: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})

export const GraphQLInputBarBlock = new GraphQLInputObjectType({
  name: 'BarInputBlock',
  fields: {
    bar: {
      type: GraphQLNonNull(GraphQLInt)
    }
  }
})

// export const GraphQLInputBlock = GraphQLUnionInputType({
//   name: 'InputBlock',
//   typeMap: {
//     [BlockType.Foo]: GraphQLInputFooBlock,
//     [BlockType.Bar]: GraphQLInputBarBlock
//   },
//   discriminatingField: 'type'
// })

export const GraphQLFooBlock = new GraphQLObjectType({
  name: BlockType.Foo,
  fields: {
    foo: {
      type: GraphQLNonNull(GraphQLString)
    }
  },
  isTypeOf(value) {
    return value.type === BlockType.Foo
  }
})

export const GraphQLBarBlock = new GraphQLObjectType({
  name: BlockType.Bar,
  fields: {
    bar: {
      type: GraphQLNonNull(GraphQLInt)
    }
  },
  isTypeOf(value) {
    return value.type === BlockType.Bar
  }
})

export const GraphQLInputBlockUnionMap = new GraphQLInputObjectType({
  name: 'InputBlockUnionMap',
  fields: {
    [BlockType.Foo]: {type: GraphQLInputFooBlock},
    [BlockType.Bar]: {type: GraphQLInputBarBlock}
  }
})

export const GraphQLBlock = new GraphQLUnionType({
  name: 'Block',
  types: [GraphQLFooBlock, GraphQLBarBlock]
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
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLInputBlockUnionMap)))
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

export const GraphQLArticleVersion = new GraphQLObjectType({
  name: 'ArticleVersion',

  fields: {
    version: {type: GraphQLInt},

    createdAt: {type: GraphQLDateTime},
    updatedAt: {type: GraphQLDateTime},

    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLBlock)))}
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
      resolve(root: AdapterArticle, _args, context: Context) {
        if (root.draftVersion == undefined) return undefined
        return context.adapter.getArticleVersion(root.id, root.draftVersion)
      }
    },

    versions: {
      type: GraphQLList(GraphQLArticleVersion),
      resolve(root: AdapterArticle, _args, context: Context) {
        return context.adapter.getArticleVersions(root.id)
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
