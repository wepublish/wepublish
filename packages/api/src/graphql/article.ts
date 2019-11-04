import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLInt,
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
    GraphQLLinkPageBreakBlock,
    GraphQLTitleBlock,
    GraphQLQuoteBlock
  ]
})

export const GraphQLArticleVersionState = new GraphQLEnumType({
  name: 'ArticleVersionState',
  description: 'Current state of the article version.',
  values: {
    DRAFT: {value: VersionState.Draft},
    DRAFT_REVIEW: {value: VersionState.DraftReview},
    PUBLISHED: {value: VersionState.Published}
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
    version: {type: GraphQLNonNull(GraphQLInt)},
    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
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
