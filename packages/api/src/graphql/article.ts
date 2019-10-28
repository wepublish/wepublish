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
import {AdapterArticle, AdapterArticleVersion, AdapterPage} from '../adapter'

import {ArticleVersionState, BlockType} from '../types'
import {GraphQLRichText} from './richText'

export const GraphQLArticleVersionState = new GraphQLEnumType({
  name: 'ArticleVersionState',
  description: 'Current state of the article version.',
  values: {
    DRAFT: {value: ArticleVersionState.Draft},
    DRAFT_REVIEW: {value: ArticleVersionState.DraftReview},
    PUBLISHED: {value: ArticleVersionState.Published}
  }
})

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

export const GraphQLInputRichTextBlock = new GraphQLInputObjectType({
  name: 'InputRichTextBlock',
  fields: {
    richText: {
      type: GraphQLNonNull(GraphQLString)
    }
  }
})

export const GraphQLInputBlockUnionMap = new GraphQLInputObjectType({
  name: 'InputBlockUnionMap',
  fields: {
    [BlockType.RichText]: {type: GraphQLInputRichTextBlock}
  }
})

export const GraphQLImage = new GraphQLObjectType<any, Context>({
  name: 'Image',
  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    filename: {type: GraphQLNonNull(GraphQLString)},
    fileSize: {type: GraphQLNonNull(GraphQLInt)},
    extension: {type: GraphQLNonNull(GraphQLString)},
    mimeType: {type: GraphQLNonNull(GraphQLString)},
    host: {type: GraphQLNonNull(GraphQLString)},
    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    url: {type: GraphQLNonNull(GraphQLString)},
    width: {type: GraphQLNonNull(GraphQLInt)},
    height: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLRichTextBlock = new GraphQLObjectType({
  name: BlockType.RichText,
  fields: {
    richText: {type: GraphQLRichText}
  },
  isTypeOf(value) {
    return value.type === BlockType.RichText
  }
})

export const GraphQLImageBlock = new GraphQLObjectType({
  name: BlockType.Image,
  fields: {
    image: {type: GraphQLImage}
  },
  isTypeOf(value) {
    return value.type === BlockType.Image
  }
})

export const GraphQLBlock = new GraphQLUnionType({
  name: 'Block',
  types: [GraphQLRichTextBlock, GraphQLImageBlock]
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

export const GraphQLAuthor = new GraphQLObjectType({
  name: 'Author',

  fields: () => ({
    id: {type: GraphQLID},
    name: {type: GraphQLString},
    image: {type: GraphQLImage},
    articles: {type: GraphQLArticleConnection}
  })
})

export const GraphQLPageVersion = new GraphQLObjectType<any, Context>({
  name: 'PageVersion',

  fields: {
    version: {type: GraphQLInt},

    createdAt: {type: GraphQLDateTime},

    slug: {type: GraphQLString},
    title: {type: GraphQLString},
    description: {type: GraphQLString},

    tags: {type: GraphQLList(GraphQLString)},

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLBlock))),
      async resolve(root: AdapterArticleVersion, _args, {adapter}) {
        const blocks = await adapter.getPageVersionBlocks(root.articleID, root.version)

        return Promise.all(
          blocks.map(async block => {
            switch (block.type) {
              case BlockType.Image:
                return {...block, image: await adapter.getImage(block.imageID)}

              default:
                return block
            }
          })
        )
      }
    }
  }
})

export const GraphQLArticleVersion = new GraphQLObjectType<any, Context>({
  name: 'ArticleVersion',

  fields: {
    version: {type: GraphQLInt},

    createdAt: {type: GraphQLDateTime},

    slug: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},

    tags: {type: GraphQLList(GraphQLString)},
    authors: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthor)))},

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLBlock))),
      async resolve(root: AdapterArticleVersion, _args, {adapter}) {
        const blocks = await adapter.getArticleVersionBlocks(root.articleID, root.version)

        return Promise.all(
          blocks.map(async block => {
            switch (block.type) {
              case BlockType.Image:
                return {...block, image: await adapter.getImage(block.imageID)}

              default:
                return block
            }
          })
        )
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

// NOTE: Because we have a recursion inside Peer we have to set the type explicitly.
export const GraphQLPage: GraphQLObjectType = new GraphQLObjectType({
  name: 'Page',

  fields: () => ({
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLDateTime},
    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    published: {
      type: GraphQLPageVersion,
      resolve(root: AdapterPage, _args, context: Context) {
        if (root.publishedVersion == undefined) return undefined
        return context.adapter.getPageVersion(root.id, root.publishedVersion)
      }
    },

    draft: {
      type: GraphQLPageVersion,
      resolve(root: AdapterPage, _args, context: Context) {
        if (root.draftVersion == undefined) return undefined
        return context.adapter.getPageVersion(root.id, root.draftVersion)
      }
    },

    versions: {
      type: GraphQLList(GraphQLPageVersion),
      resolve(root: AdapterPage, _args, context: Context) {
        return context.adapter.getPageVersions(root.id)
      }
    }
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
