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

import {GraphQLDateTime} from 'graphql-scalars'

import {Context} from '../context'

import {GraphQLImage} from './image'
import {GraphQLAuthor} from './author'
import {PublicArticle, ArticleRevision, Article, PeerArticle} from '../db/article'
import {GraphQLSlug} from './slug'
import {
  GraphQLDateFilter,
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLPageInfo,
  GraphQLUnidirectionalPageInfo
} from './common'
import {createProxyingResolver} from '../utility'
import {GraphQLPeer} from './peer'
import {GraphQLTag} from './tag/tag'
import {ArticleSort} from '@wepublish/article/api'

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
    authors: {type: new GraphQLList(new GraphQLNonNull(GraphQLID))},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
    includeHidden: {type: GraphQLBoolean},
    shared: {type: GraphQLBoolean}
  }
})

export const GraphQLPublicArticleFilter = new GraphQLInputObjectType({
  name: 'ArticleFilter',
  fields: {
    authors: {type: new GraphQLList(new GraphQLNonNull(GraphQLID))},
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))},
    includeHidden: {type: GraphQLBoolean},
    shared: {type: GraphQLBoolean}
  }
})

export const GraphQLArticleSort = new GraphQLEnumType({
  name: 'ArticleSort',
  values: {
    [ArticleSort.CreatedAt]: {value: ArticleSort.CreatedAt},
    [ArticleSort.ModifiedAt]: {value: ArticleSort.ModifiedAt},
    [ArticleSort.PublishedAt]: {value: ArticleSort.PublishedAt}
  }
})

export const GraphQLPublicArticleSort = new GraphQLEnumType({
  name: 'ArticleSort',
  values: {
    [ArticleSort.PublishedAt]: {value: ArticleSort.PublishedAt},
    [ArticleSort.ModifiedAt]: {value: ArticleSort.ModifiedAt}
  }
})

export const GraphQLArticleInput = new GraphQLInputObjectType({
  name: 'ArticleInput',
  fields: {
    slug: {type: GraphQLSlug},

    preTitle: {type: GraphQLString},
    title: {type: new GraphQLNonNull(GraphQLString)},
    lead: {type: GraphQLString},
    seoTitle: {type: GraphQLString},
    tags: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)))},

    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyInput)))
    },

    canonicalUrl: {type: GraphQLString},

    imageID: {type: GraphQLID},
    authorIDs: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID)))},

    shared: {type: new GraphQLNonNull(GraphQLBoolean)},
    hidden: {type: GraphQLBoolean},
    disableComments: {type: GraphQLBoolean},
    breaking: {type: new GraphQLNonNull(GraphQLBoolean)},

    hideAuthor: {type: new GraphQLNonNull(GraphQLBoolean)},

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaAuthorIDs: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLID)))
    },
    socialMediaImageID: {type: GraphQLID}
  }
})

export const GraphQLArticleRevision = new GraphQLObjectType<ArticleRevision, Context>({
  name: 'ArticleRevision',
  fields: {
    revision: {type: new GraphQLNonNull(GraphQLInt)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    publishAt: {type: GraphQLDateTime},

    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    hideAuthor: {type: new GraphQLNonNull(GraphQLBoolean)},

    preTitle: {type: GraphQLString},
    title: {type: GraphQLString},
    lead: {type: GraphQLString},
    seoTitle: {type: GraphQLString},
    slug: {type: GraphQLString},
    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
      deprecationReason: 'Tags now live on the Article itself'
    },

    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataProperty)))
    },

    canonicalUrl: {type: GraphQLString},

    url: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(async (articleRevision, args, {urlAdapter}, info) => {
        // The URLAdapter expects a public article to generate the public article URL.
        // The URL should never be created with values from the updatedAt, publishAt
        // and publishedAt dates, but they are required by the method.
        return await urlAdapter.getPublicArticleURL({
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
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },

    authors: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLAuthor))),
      resolve: createProxyingResolver(async ({authors}, args, {loaders}) => {
        return (await loaders.authorsByID.loadMany(authors.map(({authorId}) => authorId))).filter(
          Boolean
        )
      })
    },
    breaking: {type: new GraphQLNonNull(GraphQLBoolean)},

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaAuthors: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLAuthor))),
      resolve: createProxyingResolver(async ({socialMediaAuthors}, args, {loaders}) => {
        return (
          await loaders.authorsByID.loadMany(socialMediaAuthors.map(({authorId}) => authorId))
        ).filter(Boolean)
      })
    },
    socialMediaImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({socialMediaImageID}, args, {loaders}) => {
        return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null
      })
    }
  }
})

export const GraphQLArticle = new GraphQLObjectType<Article, Context>({
  name: 'Article',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    shared: {type: new GraphQLNonNull(GraphQLBoolean)},
    hidden: {type: GraphQLBoolean},
    disableComments: {type: GraphQLBoolean},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    draft: {type: GraphQLArticleRevision},
    published: {type: GraphQLArticleRevision},
    pending: {type: GraphQLArticleRevision},

    latest: {
      type: new GraphQLNonNull(GraphQLArticleRevision),
      resolve: createProxyingResolver(({draft, pending, published}) => {
        return draft ?? pending ?? published
      })
    },

    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag))),
      resolve: createProxyingResolver(async ({id}, _, {prisma: {tag}}) => {
        const tags = await tag.findMany({
          where: {
            articles: {
              some: {
                articleId: id
              }
            }
          }
        })

        return tags
      })
    }
  }
})

export const GraphQLArticleConnection = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLArticle)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPeerArticle = new GraphQLObjectType<PeerArticle, Context>({
  name: 'PeerArticle',
  fields: {
    peer: {
      type: new GraphQLNonNull(GraphQLPeer),
      resolve: createProxyingResolver(({peerID}, _, {loaders}) => loaders.peer.load(peerID))
    },
    peeredArticleURL: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver(async ({peerID, article}, _, {loaders, urlAdapter}) => {
        const peer = await loaders.peer.load(peerID)

        if (!peer || !article) {
          return ''
        }

        return await urlAdapter.getPeeredArticleURL(peer, article)
      })
    },
    article: {type: new GraphQLNonNull(GraphQLArticle)}
  }
})

export const GraphQLPeerArticleConnection = new GraphQLObjectType({
  name: 'PeerArticleConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPeerArticle)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLUnidirectionalPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicArticle: GraphQLObjectType<PublicArticle, Context> =
  new GraphQLObjectType<PublicArticle, Context>({
    name: 'Article',
    fields: {
      id: {type: new GraphQLNonNull(GraphQLID)}
    }
  })

export const GraphQLPublicArticleConnection = new GraphQLObjectType({
  name: 'ArticleConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicArticle)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})
