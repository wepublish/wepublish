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

import {GraphQLRichTextBlock, GraphQLImageBlock, GraphQLArticleTeaserGridBlock} from './blocks'
import {ArticleVersion} from '../adapter/article'
import {Page} from '../adapter/page'

export const GraphQLPageBlock = new GraphQLUnionType({
  name: 'PageBlock',
  types: [GraphQLRichTextBlock, GraphQLImageBlock, GraphQLArticleTeaserGridBlock]
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
      resolve(root: ArticleVersion, _args, {storageAdapter}) {
        return storageAdapter.getPageVersionBlocks(root.articleID, root.version)
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
      resolve(root: Page, _args, {storageAdapter}: Context) {
        if (root.publishedVersion == undefined) return undefined
        return storageAdapter.getPageVersion(root.id, root.publishedVersion)
      }
    },

    draft: {
      type: GraphQLPageVersion,
      resolve(root: Page, _args, {storageAdapter}: Context) {
        if (root.draftVersion == undefined) return undefined
        return storageAdapter.getPageVersion(root.id, root.draftVersion)
      }
    },

    versions: {
      type: GraphQLList(GraphQLPageVersion),
      resolve(root: Page, _args, {storageAdapter}: Context) {
        return storageAdapter.getPageVersions(root.id)
      }
    }
  })
})
