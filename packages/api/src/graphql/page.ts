import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLUnionType
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'
import {Context} from '../context'
import {AdapterArticleVersion, AdapterPage} from '../adapter'

import {BlockType} from '../types'
import {GraphQLRichTextBlock, GraphQLImageBlock, GraphQLArticleGridBlock} from './blocks'

export const GraphQLPageBlock = new GraphQLUnionType({
  name: 'PageBlock',
  types: [GraphQLRichTextBlock, GraphQLImageBlock, GraphQLArticleGridBlock]
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
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageBlock))),
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
