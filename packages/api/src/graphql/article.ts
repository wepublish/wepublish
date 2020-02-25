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
  GraphQLInt,
  GraphQLInterfaceType
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
import {GraphQLAuthor} from './author'
import {PublishedArticle, ArticleRevision, Article, ArticleSort} from '../db/article'
import {GraphQLSlug} from './slug'
import {GraphQLPageInfo} from './pageInfo'

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

export const GraphQLArticleFilter = new GraphQLInputObjectType({
  name: 'ArticleFilter',
  fields: {
    search: {type: GraphQLString},
    authors: {type: GraphQLList(GraphQLNonNull(GraphQLString))},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLArticleSort = new GraphQLEnumType({
  name: 'ArticleSort',
  values: {
    CREATED_AT: {value: ArticleSort.CreatedAt},
    MODIFIED_AT: {value: ArticleSort.ModifiedAt},
    PUBLISHED_AT: {value: ArticleSort.PublishedAt}
  }
})

// TODO: Remove this
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

export const GraphQLArticleData = new GraphQLInterfaceType({
  name: 'ArticleData',
  fields: {
    // NOTE: See `ArticleData` interface regarding these two.
    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    image: {type: GraphQLImage},
    authors: {type: GraphQLNonNull(GraphQLList(GraphQLAuthor))},

    breaking: {type: GraphQLNonNull(GraphQLBoolean)},
    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleBlock)))}
  }
})

export const GraphQLArticleRevision = new GraphQLObjectType<ArticleRevision, Context>({
  name: 'ArticleRevision',
  interfaces: [GraphQLArticleData],
  fields: {
    revision: {type: GraphQLNonNull(GraphQLInt)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishAt: {type: GraphQLDateTime},

    // NOTE: See `ArticleData` interface regarding these two.
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
    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleBlock)))}
  }
})

export const GraphQLArticle = new GraphQLObjectType<Article, Context>({
  name: 'Article',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    shared: {type: GraphQLNonNull(GraphQLBoolean)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    draft: {type: GraphQLNonNull(GraphQLArticleRevision)},
    published: {type: GraphQLArticleRevision},
    pending: {type: GraphQLArticleRevision},

    history: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleRevision)))}
  }
})

export const GraphQLArticleConnection = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticle)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublishedArticle = new GraphQLObjectType<PublishedArticle, Context>({
  name: 'PublishedArticle',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    // TODO: Consider moving these into a GraphQLInterfaceType.
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
