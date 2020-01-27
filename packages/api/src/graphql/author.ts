import {
  GraphQLNonNull,
  GraphQLID,
  GraphQLString,
  GraphQLObjectType,
  GraphQLList,
  GraphQLInt,
  GraphQLInputObjectType
} from 'graphql'

import {Author} from '../adapter/author'
import {Context} from '../context'

import {GraphQLPageInfo} from './pageInfo'
import {GraphQLImage} from './image'

export const GraphQLAuthor = new GraphQLObjectType<Author, Context>({
  name: 'Author',

  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString},
    image: {
      type: GraphQLImage,
      resolve({imageID}, args, {loaders}) {
        return imageID ? loaders.image.load(imageID) : null
      }
    }
  }
})

export const GraphQLAuthorConnection = new GraphQLObjectType<any, Context>({
  name: 'AuthorConnection',
  fields: {
    nodes: {type: GraphQLList(GraphQLAuthor)},
    totalCount: {type: GraphQLNonNull(GraphQLInt)},
    pageInfo: {type: GraphQLNonNull(GraphQLPageInfo)}
  }
})

export const GraphQLCreateAuthorInput = new GraphQLInputObjectType({
  name: 'CreateAuthorInput',
  fields: {
    name: {type: GraphQLString},
    imageID: {type: GraphQLID}
  }
})

export const GraphQLUpdateAuthorInput = new GraphQLInputObjectType({
  name: 'UpdateAuthorInput',
  fields: {
    id: {type: GraphQLNonNull(GraphQLID)},
    name: {type: GraphQLString},
    imageID: {type: GraphQLID}
  }
})
