import {GraphQLSchema} from 'graphql'

import GraphQLQuery from './query'
import GraphQLMutation from './mutation'

export const GraphQLWepublishSchema = new GraphQLSchema({
  query: GraphQLQuery,
  mutation: GraphQLMutation
})
