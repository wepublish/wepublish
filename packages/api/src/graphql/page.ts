import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
  GraphQLUnionType,
  GraphQLInputObjectType
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'
import {Context} from '../context'

import {
  GraphQLRichTextBlock,
  GraphQLImageBlock,
  GraphQLArticleTeaserGridBlock,
  GraphQLArticleTeaserGridBlockInput,
  GraphQLInputTitleBlock,
  GraphQLInputImageBlock,
  GraphQLInputRichTextBlock,
  GraphQLTitleBlock
} from './blocks'

import {Page} from '../adapter/page'
import {GraphQLVersionState} from './article'
import {BlockType} from '../adapter/blocks'
import {GraphQLImage} from './image'

export const GraphQLPageBlockUnionMap = new GraphQLInputObjectType({
  name: 'PageBlockUnionMap',
  fields: {
    [BlockType.RichText]: {type: GraphQLInputRichTextBlock},
    [BlockType.Image]: {type: GraphQLInputImageBlock},
    [BlockType.Title]: {type: GraphQLInputTitleBlock},
    [BlockType.ArticleTeaserGrid]: {type: GraphQLArticleTeaserGridBlockInput}
  }
})

export const GraphQLPageBlock = new GraphQLUnionType({
  name: 'PageBlock',
  types: [GraphQLRichTextBlock, GraphQLTitleBlock, GraphQLImageBlock, GraphQLArticleTeaserGridBlock]
})

export const GraphQLPageInput = new GraphQLInputObjectType({
  name: 'PageInput',
  fields: {
    slug: {type: GraphQLNonNull(GraphQLString)},
    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    imageID: {type: GraphQLID},
    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageBlockUnionMap)))
    }
  }
})

export const GraphQLPageVersion = new GraphQLObjectType<any, Context>({
  name: 'PageVersion',

  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    version: {type: GraphQLNonNull(GraphQLInt)},
    state: {type: GraphQLNonNull(GraphQLVersionState)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    slug: {type: GraphQLNonNull(GraphQLString)},
    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLNonNull(GraphQLString)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {loaders}) {
        return imageID ? loaders.image.load(imageID) : null
      }
    },

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageBlock)))}
  }
})

// NOTE: Because we have a recursion inside Peer we have to set the type explicitly.
export const GraphQLPage: GraphQLObjectType = new GraphQLObjectType({
  name: 'Page',

  fields: () => ({
    id: {type: GraphQLNonNull(GraphQLID)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLDateTime},

    published: {
      type: GraphQLPageVersion,
      resolve(root: Page, _args, {storageAdapter}: Context) {
        if (root.publishedAt == undefined || root.publishedVersion == undefined) return null
        if (new Date().getTime() < root.publishedAt.getTime()) return null

        return storageAdapter.getPageVersion(root.id, root.publishedVersion)
      }
    },

    latest: {
      type: GraphQLPageVersion,
      async resolve(root: Page, _args, {storageAdapter, authenticate}: Context) {
        await authenticate()
        return storageAdapter.getPageVersion(root.id, root.latestVersion)
      }
    },

    versions: {
      type: GraphQLList(GraphQLPageVersion),
      async resolve(root: Page, _args, {storageAdapter, authenticate}: Context) {
        await authenticate()
        return storageAdapter.getPageVersions(root.id)
      }
    }
  })
})

export const GraphQLPageConnection = new GraphQLObjectType({
  name: 'PageConnection',
  fields: {
    nodes: {type: GraphQLList(GraphQLPage)}
    // pageInfo: {type: GraphQLPageInfo} // TODO
  }
})
