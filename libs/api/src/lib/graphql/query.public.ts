import {GraphQLObjectType} from 'graphql'
import {Context} from '../context'

export const GraphQLPublicQuery = new GraphQLObjectType<undefined, Context>({
  name: 'Query',
  fields: {}
})
