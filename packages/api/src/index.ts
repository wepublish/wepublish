import {GraphQLSchema} from 'graphql'
import {GraphQLQuery, GraphQLMutation} from './graphql'

export * from './graphql'
export * from './adapter'
export * from './context'
export * from './utility'
export * from './types'
export * from './error'

export const WepublishGraphQLSchema = new GraphQLSchema({
  query: GraphQLQuery,
  mutation: GraphQLMutation
})
