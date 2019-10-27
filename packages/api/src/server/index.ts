import {GraphQLSchema} from 'graphql'

import {GraphQLQuery, GraphQLMutation} from './graphql'
import {Adapter} from './adapter'

export * from './graphql'
export * from './adapter'
export * from './context'

export interface HandlerOptions {
  adapter: Adapter
  tokenSecret: string
  refreshTokenExpiresIn?: number
  accessTokenExpiresIn?: number
  peerFetchTimeout: number
}

export const WepublishGraphQLSchema = new GraphQLSchema({
  query: GraphQLQuery,
  mutation: GraphQLMutation
})
