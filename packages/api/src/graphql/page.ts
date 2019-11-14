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
  GraphQLArticleTeaserGridBlockInput
} from './blocks'

import {Page, PageVersion} from '../adapter/page'
import {GraphQLVersionState} from './article'
import {BlockType} from '../adapter/blocks'
import {GraphQLImage} from './image'

export const GraphQLPageBlockUnionMap = new GraphQLInputObjectType({
  name: 'PageBlockUnionMap',
  fields: {
    [BlockType.ArticleTeaserGrid]: {type: GraphQLArticleTeaserGridBlockInput}
  }
})

export const GraphQLPageBlock = new GraphQLUnionType({
  name: 'PageBlock',
  types: [GraphQLRichTextBlock, GraphQLImageBlock, GraphQLArticleTeaserGridBlock]
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

    slug: {type: GraphQLString},
    title: {type: GraphQLString},
    description: {type: GraphQLString},

    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {storageAdapter}) {
        return imageID ? storageAdapter.getImage(imageID) : null
      }
    },

    tags: {type: GraphQLList(GraphQLString)},

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageBlock))),
      resolve(root: PageVersion, _args, {storageAdapter}) {
        return storageAdapter.getPageVersionBlocks(root.id, root.version)
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
