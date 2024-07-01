import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType,
  GraphQLEnumType
} from 'graphql'

import {Author, AuthorSort} from '../db/author'
import {Context} from '../context'

import {GraphQLPageInfo} from './common'
import {GraphQLImage} from './image'
import {GraphQLSlug} from './slug'
import {GraphQLRichText} from '@wepublish/richtext/api'
import {GraphQLDateTime} from 'graphql-scalars'
import {createProxyingResolver} from '../utility'
import {GraphQLTag} from './tag/tag'

export const GraphQLAuthorLink = new GraphQLObjectType<Author, Context>({
  name: 'AuthorLink',
  fields: {
    title: {type: new GraphQLNonNull(GraphQLString)},
    url: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLAuthor = new GraphQLObjectType<Author, Context>({
  name: 'Author',
  fields: {
    id: {type: new GraphQLNonNull(GraphQLID)},

    createdAt: {type: new GraphQLNonNull(GraphQLDateTime)},
    modifiedAt: {type: new GraphQLNonNull(GraphQLDateTime)},

    name: {type: new GraphQLNonNull(GraphQLString)},
    slug: {type: new GraphQLNonNull(GraphQLSlug)},
    url: {
      type: new GraphQLNonNull(GraphQLString),
      resolve: createProxyingResolver((author, _, {urlAdapter}) => {
        return urlAdapter.getAuthorURL(author)
      })
    },
    links: {type: new GraphQLList(new GraphQLNonNull(GraphQLAuthorLink))},
    bio: {type: GraphQLRichText},
    jobTitle: {type: GraphQLString},
    image: {
      type: GraphQLImage,
      resolve: createProxyingResolver(({imageID}, args, {loaders}) => {
        return imageID ? loaders.images.load(imageID) : null
      })
    },
    tags: {
      type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLTag))),
      resolve: createProxyingResolver(async ({id}, _, {prisma: {tag}}) => {
        const tags = await tag.findMany({
          where: {
            authors: {
              some: {
                authorId: id
              }
            }
          }
        })

        return tags
      })
    }
  }
})

export const GraphQLAuthorFilter = new GraphQLInputObjectType({
  name: 'AuthorFilter',
  fields: {
    name: {type: GraphQLString},
    tagIds: {type: new GraphQLList(new GraphQLNonNull(GraphQLID))}
  }
})

export const GraphQLAuthorSort = new GraphQLEnumType({
  name: 'AuthorSort',
  values: {
    CREATED_AT: {value: AuthorSort.CreatedAt},
    MODIFIED_AT: {value: AuthorSort.ModifiedAt},
    NAME: {value: AuthorSort.Name}
  }
})

export const GraphQLAuthorConnection = new GraphQLObjectType<any, Context>({
  name: 'AuthorConnection',
  fields: {
    nodes: {type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(GraphQLAuthor)))},
    pageInfo: {type: new GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: new GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLAuthorLinkInput = new GraphQLInputObjectType({
  name: 'AuthorLinkInput',
  fields: {
    title: {type: new GraphQLNonNull(GraphQLString)},
    url: {type: new GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLAuthorInput = new GraphQLInputObjectType({
  name: 'AuthorInput',
  fields: {
    name: {type: new GraphQLNonNull(GraphQLString)},
    slug: {type: new GraphQLNonNull(GraphQLSlug)},
    links: {type: new GraphQLList(new GraphQLNonNull(GraphQLAuthorLinkInput))},
    bio: {type: GraphQLRichText},
    jobTitle: {type: GraphQLString},
    imageID: {type: GraphQLID},
    tagIds: {type: new GraphQLList(new GraphQLNonNull(GraphQLID))}
  }
})
