import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLID,
  GraphQLList,
  GraphQLString,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLBoolean,
  GraphQLInt
} from 'graphql'

import {GraphQLDateTime} from 'graphql-iso-date'

import {Context} from '../context'

import {GraphQLImage} from './image'
import {GraphQLAuthor} from './author'
import {PublicArticle, ArticleRevision, Article, ArticleSort, PeerArticle} from '../db/article'
import {GraphQLSlug} from './slug'
import {
  GraphQLDateFilter,
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLMetadataPropertyPublic,
  GraphQLPageInfo,
  GraphQLUnidirectionalPageInfo
} from './common'
import {GraphQLBlockInput, GraphQLBlock, GraphQLPublicBlock} from './blocks'
import {createProxyingResolver} from '../utility'
import {GraphQLPeer} from './peer'
import {GraphQLPublicComment} from './comment/comment'
import {SessionType} from '../db/session'
import {getPublicCommentsForItemById} from './comment/comment.public-queries'

export const GraphQLArticleFilter = new GraphQLInputObjectType({
  name: 'ArticleFilter',
  fields: {
    title: {type: GraphQLString},
    preTitle: {type: GraphQLString},
    lead: {type: GraphQLString},
    publicationDateFrom: {type: GraphQLDateFilter},
    publicationDateTo: {type: GraphQLDateFilter},
    draft: {type: GraphQLBoolean},
    published: {type: GraphQLBoolean},
    pending: {type: GraphQLBoolean},
    authors: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPublicArticleFilter = new GraphQLInputObjectType({
  name: 'ArticleFilter',
  fields: {
    authors: {type: GraphQLList(GraphQLNonNull(GraphQLID))},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLArticleSort = new GraphQLEnumType({
  name: 'ArticleSort',
  values: {
    CREATED_AT: {value: ArticleSort.CreatedAt},
    MODIFIED_AT: {value: ArticleSort.ModifiedAt},
    PUBLISH_AT: {value: ArticleSort.PublishAt},
    PUBLISHED_AT: {value: ArticleSort.PublishedAt},
    UPDATED_AT: {value: ArticleSort.UpdatedAt}
  }
})

export const GraphQLPublicArticleSort = new GraphQLEnumType({
  name: 'ArticleSort',
  values: {
    PUBLISHED_AT: {value: ArticleSort.PublishedAt},
    UPDATED_AT: {value: ArticleSort.UpdatedAt}
  }
})

export const GraphQLArticleInput = new GraphQLInputObjectType({
  name: 'ArticleInput',
  fields: {
    slug: {type: GraphQLSlug},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    seoTitle: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyInput)))},

    canonicalUrl: {type: GraphQLString},

    imageID: {type: GraphQLID},
    authorIDs: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLID)))},

    shared: {type: GraphQLNonNull(GraphQLBoolean)},
    breaking: {type: GraphQLNonNull(GraphQLBoolean)},

    hideAuthor: {type: GraphQLNonNull(GraphQLBoolean)},

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaAuthorIDs: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLID)))},
    socialMediaImageID: {type: GraphQLID},

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLBlockInput)))
    }
  }
})

export const GraphQLArticleRevision = new GraphQLObjectType<ArticleRevision, Context>({
  name: 'ArticleRevision',
  fields: {
    revision: {type: GraphQLNonNull(GraphQLInt)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishAt: {type: GraphQLDateTime},

    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    hideAuthor: {type: GraphQLNonNull(GraphQLBoolean)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    seoTitle: {type: GraphQLString},
    slug: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataProperty)))},

    canonicalUrl: {type: GraphQLString},

    url: {
      type: GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver((articleRevision, args, {urlAdapter}, info) => {
        // The URLAdapter expects a public article to generate the public article URL.
        // The URL should never be created with values from the updatedAt, publishAt
        // and publishedAt dates, but they are required by the method.
        return urlAdapter.getPublicArticleURL({
          ...articleRevision,
          id: info?.variableValues?.id || 'ID-DOES-NOT-EXIST',
          shared: true,
          updatedAt: new Date(),
          publishAt: new Date(),
          publishedAt: new Date()
        } as PublicArticle)
      })
    },

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}, info) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },

    authors: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthor))),
      resolve: createProxyingResolver(({authors}, args, {loaders}) => {
        return loaders.authorsByID.loadMany(authors.map(({authorId}) => authorId))
      })
    },

    breaking: {type: GraphQLNonNull(GraphQLBoolean)},

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaAuthors: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthor))),
      resolve: createProxyingResolver(({socialMediaAuthors}, args, {loaders}) => {
        return loaders.authorsByID.loadMany(socialMediaAuthors.map(({authorId}) => authorId))
      })
    },
    socialMediaImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({socialMediaImageID}, args, {loaders}, info) => {
        return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null
      })
    },

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLBlock)))}
  }
})

export const GraphQLArticle = new GraphQLObjectType<Article, Context>({
  name: 'Article',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    shared: {type: GraphQLNonNull(GraphQLBoolean)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    draft: {type: GraphQLArticleRevision},
    published: {type: GraphQLArticleRevision},
    pending: {type: GraphQLArticleRevision},

    latest: {
      type: GraphQLNonNull(GraphQLArticleRevision),
      resolve: createProxyingResolver(({draft, pending, published}, {}, {}, info) => {
        return draft ?? pending ?? published
      })
    }
    // TODO: Implement article history
    // history: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLArticleRevision)))}
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

export const GraphQLPeerArticle = new GraphQLObjectType<PeerArticle, Context>({
  name: 'PeerArticle',
  fields: {
    peer: {
      type: GraphQLNonNull(GraphQLPeer),
      resolve: createProxyingResolver(({peerID}, {}, {loaders}) => loaders.peer.load(peerID))
    },
    peeredArticleURL: {
      type: GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(async ({peerID, article}, {}, {loaders, urlAdapter}) => {
        const peer = await loaders.peer.load(peerID)
        if (!peer || !article) return ''
        return urlAdapter.getPeeredArticleURL(peer, article)
      })
    },
    article: {type: GraphQLNonNull(GraphQLArticle)}
  }
})

export const GraphQLPeerArticleConnection = new GraphQLObjectType({
  name: 'PeerArticleConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPeerArticle)))},
    pageInfo: {type: GraphQLNonNull(GraphQLUnidirectionalPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicArticle: GraphQLObjectType<
  PublicArticle,
  Context
> = new GraphQLObjectType<PublicArticle, Context>({
  name: 'Article',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},

    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    slug: {type: GraphQLNonNull(GraphQLSlug)},

    url: {
      type: GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver((article, {}, {urlAdapter}) => {
        return urlAdapter.getPublicArticleURL(article)
      })
    },

    preTitle: {type: GraphQLString},
    title: {type: GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    seoTitle: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    canonicalUrl: {type: GraphQLString},

    properties: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyPublic))),
      resolve: ({properties}) => {
        return properties.filter(property => property.public).map(({key, value}) => ({key, value}))
      }
    },

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}, info) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },

    authors: {
      type: GraphQLNonNull(GraphQLList(GraphQLAuthor)),
      resolve: createProxyingResolver(({authors, hideAuthor}, args, {loaders}) => {
        if (hideAuthor) {
          return []
        }

        return authors.map(({authorId}) => loaders.authorsByID.load(authorId))
      })
    },

    breaking: {type: GraphQLNonNull(GraphQLBoolean)},

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaAuthors: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLAuthor))),
      resolve: createProxyingResolver(({socialMediaAuthors, hideAuthor}, args, {loaders}) => {
        if (hideAuthor) {
          return []
        }

        return loaders.authorsByID.loadMany(socialMediaAuthors.map(({authorId}) => authorId))
      })
    },
    socialMediaImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({socialMediaImageID}, args, {loaders}, info) => {
        return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null
      })
    },

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicBlock)))},

    comments: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicComment))),
      resolve: createProxyingResolver(
        async (
          {id},
          _,
          {session, authenticateUser, prisma: {comment, commentRatingSystemAnswer}}
        ) => {
          // if session exists, should get user's un-approved comments as well
          // if not we should get approved ones
          const userSession = session?.type === SessionType.User ? authenticateUser() : null

          return getPublicCommentsForItemById(
            id,
            userSession?.user?.id ?? null,
            null,
            -1,
            commentRatingSystemAnswer,
            comment
          )
        }
      )
    }
  }
})

export const GraphQLPublicArticleConnection = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicArticle)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
