import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLBoolean
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

import {GraphQLPeer} from './peer'
import {GraphQLDateRange} from './dateRange'

import {Context} from '../context'

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
  GraphQLLinkPageBreakBlock,
  GraphQLQuoteBlock,
  GraphQLTitleBlock
} from './blocks'

import {GraphQLImage} from './image'
import {BlockType} from '../adapter/blocks'
import {VersionState} from '../adapter/versionState'
import {ArticleVersion, Article} from '../adapter/article'
import {Author} from '../adapter/author'

export const GraphQLArticleBlockUnionMap = new GraphQLInputObjectType({
  name: 'ArticleBlockUnionMap',
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
    GraphQLLinkPageBreakBlock,
    GraphQLTitleBlock,
    GraphQLQuoteBlock
  ]
})

export const GraphQLVersionState = new GraphQLEnumType({
  name: 'VersionState',
  description: 'Current state of the article/page version.',
  values: {
    DRAFT: {value: VersionState.Draft},
    PUBLISHED: {value: VersionState.Published}
  }
})

export const GraphQLArticleInput = new GraphQLInputObjectType({
  name: 'ArticleInput',
  fields: {
    slug: {type: GraphQLNonNull(GraphQLString)},
    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLNonNull(GraphQLString)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    imageID: {type: GraphQLID},
    authorIDs: {type: GraphQLNonNull(GraphQLList(GraphQLID))},
    shared: {type: GraphQLNonNull(GraphQLBoolean)},
    breaking: {type: GraphQLNonNull(GraphQLBoolean)},
    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleBlockUnionMap)))
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

export const GraphQLAuthor = new GraphQLObjectType<Author, Context>({
  name: 'Author',

  fields: () => ({
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {storageAdapter}) {
        return imageID ? storageAdapter.getImage(imageID) : null
      }
    }
  })
})

export const GraphQLArticleVersion = new GraphQLObjectType<ArticleVersion, Context>({
  name: 'ArticleVersion',

  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    breaking: {type: GraphQLNonNull(GraphQLBoolean)},
    slug: {type: GraphQLNonNull(GraphQLString)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLNonNull(GraphQLString)},
    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {storageAdapter}) {
        return imageID ? storageAdapter.getImage(imageID) : null
      }
    },

    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},
    authors: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthor))),
      resolve({authorIDs}, args, {storageAdapter}) {
        return Promise.all(authorIDs.map(authorID => storageAdapter.getAuthor(authorID)))
      }
    },

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleBlock))),
      resolve({articleID, version}, _args, {storageAdapter}) {
        return storageAdapter.getArticleVersionBlocks(articleID, version)
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
      resolve(root: Article, _args, {storageAdapter}: Context) {
        if (root.publishedVersion == undefined) return undefined
        return storageAdapter.getArticleVersion(root.id, root.publishedVersion)
      }
    },

    draft: {
      type: GraphQLArticleVersion,
      async resolve(root: Article, _args, {storageAdapter, authenticate}: Context) {
        await authenticate()
        if (root.draftVersion == undefined) return undefined
        return storageAdapter.getArticleVersion(root.id, root.draftVersion)
      }
    },

    latest: {
      type: GraphQLArticleVersion,
      async resolve(root: Article, _args, {storageAdapter, authenticate}: Context) {
        await authenticate()
        if (root.latestVersion == undefined) return undefined
        return storageAdapter.getArticleVersion(root.id, root.latestVersion)
      }
    },

    versions: {
      type: GraphQLList(GraphQLArticleVersion),
      async resolve(root: Article, _args, {storageAdapter, authenticate}: Context) {
        await authenticate()
        return storageAdapter.getArticleVersions(root.id)
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
