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

import {Author} from '../db/author'
import {Context} from '../context'

import {GraphQLPageInfo} from './common'
import {GraphQLImage} from './image'
import {GraphQLSlug} from './slug'
import {AuthorSort} from '../db/author'
import {GraphQLRichText} from './richText'

export const GraphQLAuthorLink = new GraphQLObjectType<Author, Context>({
  name: 'AuthorLink',
  fields: {
    title: {type: GraphQLNonNull(GraphQLString)},
    url: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLAuthor = new GraphQLObjectType<Author, Context>({
  name: 'Author',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    url: {
      type: GraphQLNonNull(GraphQLString),
      resolve(author, {}, {urlAdapter}) {
        return urlAdapter.getAuthorURL(author)
      }
    },
    links: {type: GraphQLList(GraphQLNonNull(GraphQLAuthorLink))},
    bio: {type: GraphQLRichText},
    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {loaders}) {
        return imageID ? loaders.images.load(imageID) : null
      }
    }
  }
})

export const GraphQLAuthorFilter = new GraphQLInputObjectType({
  name: 'AuthorFilter',
  fields: {
    name: {type: GraphQLString}
  }
})

export const GraphQLAuthorSort = new GraphQLEnumType({
  name: 'AuthorSort',
  values: {
    CREATED_AT: {value: AuthorSort.CreatedAt},
    MODIFIED_AT: {value: AuthorSort.ModifiedAt}
  }
})

export const GraphQLAuthorConnection = new GraphQLObjectType<any, Context>({
  name: 'AuthorConnection',
  fields: {
    nodes: {type: GraphQLList(GraphQLAuthor)},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)}
  }
})

export const GraphQLAuthorLinkInput = new GraphQLInputObjectType({
  name: 'AuthorLinkInput',
  fields: {
    title: {type: GraphQLNonNull(GraphQLString)},
    url: {type: GraphQLNonNull(GraphQLString)}
  }
})

export const GraphQLAuthorInput = new GraphQLInputObjectType({
  name: 'AuthorInput',
  fields: {
    name: {type: GraphQLNonNull(GraphQLString)},
    slug: {type: GraphQLNonNull(GraphQLSlug)},
    links: {type: GraphQLList(GraphQLNonNull(GraphQLAuthorLinkInput))},
    bio: {type: GraphQLRichText},
    imageID: {type: GraphQLID}
  }
})
