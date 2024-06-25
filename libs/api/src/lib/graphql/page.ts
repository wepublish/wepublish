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
import {GraphQLTag} from './tag/tag'

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
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))}
  }
})

export const GraphQLPublishedPageFilter = new GraphQLInputObjectType({
  name: 'PublishedPageFilter',
  fields: {
    tags: {type: new GraphQLList(new GraphQLNonNull(GraphQLString))}
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
    slug: {type: new GraphQLNonNull(GraphQLSlug)},

    title: {type: new GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    tags: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString)))},

    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyInput)))
    },

    imageID: {type: GraphQLID},

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaImageID: {type: GraphQLID},

    blocks: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLBlockInput)))
    }
  })
})

export const GraphQLPageRevision = new GraphQLObjectType<PageRevision, Context>({
  name: 'PageRevision',
  fields: () => ({
    revision: {type: new GraphQLNonNull(GraphQLInt)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    publishAt: {type: GraphQLDateTime},

    updatedAt: {type: GraphQLDateTime},
    publishedAt: {type: GraphQLDateTime},

    slug: {type: GraphQLSlug},

    title: {type: GraphQLString},
    description: {type: GraphQLString},
    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLString))),
      deprecationReason: 'Tags now live on the Page itself'
    },

    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataProperty)))
    },

    url: {
      type: new GraphQLNonNull(GraphQLString),
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
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({socialMediaImageID}, args, {loaders}) => {
        return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null
      })
    },

    blocks: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLBlock)))}
  })
})

export const GraphQLPage = new GraphQLObjectType<Page, Context>({
  name: 'Page',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},
    shared: {type: new GraphQLNonNull(GraphQLBoolean)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

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
      type: new GraphQLNonNull(GraphQLPageRevision),
      resolve: createProxyingResolver(({draft, pending, published}) => {
        return draft ?? pending ?? published
      })
    },

    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag))),
      resolve: createProxyingResolver(async ({id}, _, {prisma: {tag}}) => {
        const tags = await tag.findMany({
          where: {
            pages: {
              some: {
                pageId: id
              }
            }
          }
        })

        return tags
      })
    }
  }
  // TODO: Implement page history
  // history: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPageRevision)))}
})

export const GraphQLPageConnection = new GraphQLObjectType({
  name: 'PageConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPage)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLPublicPage = new GraphQLObjectType<PublicPage, Context>({
  name: 'Page',
  fields: () => ({
    id: {type: new GraphQLNonNull(GraphQLID)},

    updatedAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    publishedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    slug: {type: new GraphQLNonNull(GraphQLSlug)},

    url: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver((page, _, {urlAdapter}) => {
        return urlAdapter.getPublicPageURL(page)
      })
    },

    title: {type: new GraphQLNonNull(GraphQLString)},
    description: {type: GraphQLString},
    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag))),
      resolve: createProxyingResolver(async ({id}, _, {prisma: {tag}}) => {
        const tags = await tag.findMany({
          where: {
            pages: {
              some: {
                pageId: id
              }
            }
          }
        })

        return tags
      })
    },

    properties: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLMetadataPropertyPublic))),
      resolve: ({properties}) => {
        return properties.filter(property => property.public).map(({key, value}) => ({key, value}))
      }
    },

    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },

    socialMediaTitle: {type: GraphQLString},
    socialMediaDescription: {type: GraphQLString},
    socialMediaImage: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({socialMediaImageID}, args, {loaders}) => {
        return socialMediaImageID ? loaders.images.load(socialMediaImageID) : null
      })
    },

    blocks: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicBlock)))}
  })
})

export const GraphQLPublicPageConnection = new GraphQLObjectType({
  name: 'PageConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLPublicPage)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})
