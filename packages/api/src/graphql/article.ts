import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLUnionType,
  GraphQLBoolean,
  GraphQLInt
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

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
  GraphQLTitleBlock,
  GraphQLInputImageBlock,
  GraphQLInputTitleBlock,
  GraphQLInputQuoteBlock,
  GraphQLInputFacebookPostBlock,
  GraphQLInputInstagramPostBlock,
  GraphQLInputTwitterTweetBlock,
  GraphQLInputVimeoVideoBlock,
  GraphQLInputYouTubeVideoBlock,
  GraphQLInputSoundCloudTrackBlock,
  GraphQLInputEmbedBlock,
  GraphQLEmbedBlock,
  GraphQLInputLinkPageBreakBlock
} from './blocks'

import {GraphQLImage} from './image'
import {BlockType} from '../adapter/blocks'
import {VersionState} from '../adapter/versionState'
import {ArticleVersion} from '../adapter/article'
import {GraphQLAuthor} from './author'
import {PublishedArticle, Article} from '../db/article'
import {GraphQLSlug} from './slug'

export const GraphQLArticleBlockUnionMap = new GraphQLInputObjectType({
  name: 'ArticleBlockUnionMap',
  fields: {
    [BlockType.RichText]: {type: GraphQLInputRichTextBlock},
    [BlockType.Image]: {type: GraphQLInputImageBlock},
    [BlockType.Title]: {type: GraphQLInputTitleBlock},
    [BlockType.Quote]: {type: GraphQLInputQuoteBlock},
    [BlockType.FacebookPost]: {type: GraphQLInputFacebookPostBlock},
    [BlockType.InstagramPost]: {type: GraphQLInputInstagramPostBlock},
    [BlockType.TwitterTweet]: {type: GraphQLInputTwitterTweetBlock},
    [BlockType.VimeoVideo]: {type: GraphQLInputVimeoVideoBlock},
    [BlockType.YouTubeVideo]: {type: GraphQLInputYouTubeVideoBlock},
    [BlockType.SoundCloudTrack]: {type: GraphQLInputSoundCloudTrackBlock},
    [BlockType.Embed]: {type: GraphQLInputEmbedBlock},
    [BlockType.LinkPageBreak]: {type: GraphQLInputLinkPageBreakBlock}
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
    GraphQLEmbedBlock,
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
    slug: {type: GraphQLNonNull(GraphQLSlug)},

    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    imageID: {type: GraphQLID},
    authorIDs: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLID)))},

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

export const GraphQLArticle = new GraphQLObjectType<Article, Context>({
  name: 'Article',

  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {loaders}, info) {
        return imageID ? loaders.image.load(imageID) : null
      }
    },

    authors: {
      type: GraphQLNonNull(GraphQLList(GraphQLAuthor)),
      resolve({authorIDs}, args, {storageAdapter}) {
        return Promise.all(authorIDs.map(authorID => storageAdapter.getAuthor(authorID)))
      }
    },

    breaking: {type: GraphQLNonNull(GraphQLBoolean)},
    shared: {type: GraphQLNonNull(GraphQLBoolean)},

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleBlock)))}
  }
})

export const GraphQLArticleVersion = new GraphQLObjectType<ArticleVersion, Context>({
  name: 'ArticleVersion',

  fields: {
    id: {type: GraphQLNonNull(GraphQLString)},
    revision: {type: GraphQLNonNull(GraphQLInt)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishAt: {type: GraphQLDateTime},

    article: {type: GraphQLNonNull(GraphQLArticle)}
  }
})

export const GraphQLArticleConnection = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticle)))},
    totalCount: {type: GraphQLNonNull(GraphQLInt)},
    pageInfo: {type: GraphQLNonNull(GraphQLArticlePageInfo)}
  }
})

export const GraphQLPublishedArticle = new GraphQLObjectType<PublishedArticle, Context>({
  name: 'PublishedArticle',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {loaders}, info) {
        return imageID ? loaders.image.load(imageID) : null
      }
    },

    authors: {
      type: GraphQLNonNull(GraphQLList(GraphQLAuthor)),
      resolve({authorIDs}, args, {loaders}) {
        return Promise.all(authorIDs.map(authorID => loaders.authors.load(authorID)))
      }
    },

    breaking: {type: GraphQLNonNull(GraphQLBoolean)},
    shared: {type: GraphQLNonNull(GraphQLBoolean)},

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleBlock)))}
  }
})
