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
import {PublicPage, PageRevision, Page, PageSort} from '../db/page'
import {GraphQLSlug} from './slug'
import {
  GraphQLDateFilter,
  GraphQLMetadataProperty,
  GraphQLMetadataPropertyInput,
  GraphQLMetadataPropertyPublic,
  GraphQLPageInfo
} from './common'

import {GraphQLBlockInput, GraphQLBlock, GraphQLPublicBlock} from './blocks'
import {createProxyingResolver} from '../utility'

export const GraphQLPageFilter = new GraphQLInputObjectType({
  name: 'PageFilter',
  fields: {
    title: {type: GraphQLString},
    draft: {type: GraphQLBoolean},
    description: {type: GraphQLString},
    publicationDateFrom: {type: GraphQLDateFilter},
    publicationDateTo: {type: GraphQLDateFilter},
    published: {type: GraphQLBoolean},
    pending: {type: GraphQLBoolean},
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPublishedPageFilter = new GraphQLInputObjectType({
  name: 'PublishedPageFilter',
  fields: {
    tags: {type: GraphQLList(GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPageSort = new GraphQLEnumType({
  name: 'PageSort',
  values: {
    CREATED_AT: {value: PageSort.CreatedAt},
    MODIFIED_AT: {value: PageSort.ModifiedAt},
    PUBLISH_AT: {value: PageSort.PublishAt},
    PUBLISHED_AT: {value: PageSort.PublishedAt},
    UPDATED_AT: {value: PageSort.UpdatedAt}
  }
})

export const GraphQLPublishedPageSort = new GraphQLEnumType({
  name: 'PublishedPageSort',
  values: {
    PUBLISHED_AT: {value: PageSort.PublishedAt},
    UPDATED_AT: {value: PageSort.UpdatedAt}
  }
})

export const GraphQLPageInput = new GraphQLInputObjectType({
  name: 'PageInput',
  fields: () => ({
    slug: {type: GraphQLNonNull(GraphQLSlug)},

    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataPropertyInput)))},

    imageID: {type: GraphQLID},

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaImageID: {type: GraphQLID},

    blocks: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLBlockInput)))
    }
  })
})

export const GraphQLPageRevision = new GraphQLObjectType<PageRevision, Context>({
  name: 'PageRevision',
  fields: () => ({
    revision: {type: GraphQLNonNull(GraphQLInt)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishAt: {type: GraphQLDateTime},

    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    slug: {type: GraphQLSlug},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

    properties: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLMetadataProperty)))},

    url: {
      type: GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver((pageRevision, args, {urlAdapter}, info) => {
        // The URLAdapter expects a public page to generate the public page URL.
        // The URL should never be created with values from the updatedAt and
        // publishedAt dates, but they are required by the method.
        return urlAdapter.getPublicPageURL({
          ...pageRevision,
          id: info?.variableValues?.id || 'ID-DOES-NOT-EXIST',
          updatedAt: new Date(),
          publishedAt: new Date()
        } as PublicPage)
      })
    },

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}, info) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({socialMediaImageID}, args, {loaders}, info) => {
        return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null
      })
    },

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLBlock)))}
  })
})

export const GraphQLPage = new GraphQLObjectType<Page, Context>({
  name: 'Page',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    shared: {type: GraphQLNonNull(GraphQLBoolean)},

    createdAt: {type: GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    draft: {
      type: GraphQLPageRevision
    },

    published: {
      type: GraphQLPageRevision
    },

    pending: {
      type: GraphQLPageRevision
    },

    latest: {
      type: GraphQLNonNull(GraphQLPageRevision),
      resolve: createProxyingResolver(({draft, pending, published}) => {
        return draft ?? pending ?? published
      })
    }
  }
  // TODO: Implement page history
  // history: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPageRevision)))}
})

export const GraphQLPageConnection = new GraphQLObjectType({
  name: 'PageConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPage)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicPage = new GraphQLObjectType<PublicPage, Context>({
  name: 'Page',
  fields: () => ({
    id: {type: GraphQLNonNull(GraphQLID)},

    updatedAt: {type: GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: GraphQLNonNull(GraphQLDateTime)},

    slug: {type: GraphQLNonNull(GraphQLSlug)},

    url: {
      type: GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver((page, _, {urlAdapter}) => {
        return urlAdapter.getPublicPageURL(page)
      })
    },

    title: {type: GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    tags: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLString)))},

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

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({socialMediaImageID}, args, {loaders}, info) => {
        return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null
      })
    },

    blocks: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicBlock)))}
  })
})

export const GraphQLPublicPageConnection = new GraphQLObjectType({
  name: 'PageConnection',
  fields: {
    nodes: {type: GraphQLNonNull(GraphQLList(GraphQLNonNull(GraphQLPublicPage)))},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})
