import {GraphQLNonNull, GraphQLObjectType, GraphQLString} from 'graphql'
import {Context, SystemInformation} from '../context'

export const GraphQLSystemInformation = new GraphQLObjectType<SystemInformation, Context>({
  name: 'SystemInformation',
  fields: {
    version: {type: GraphQLNonNull(GraphQLString)}
  }
})
