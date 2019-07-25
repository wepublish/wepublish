import {RequestListener} from 'http'
import {GraphQLSchema} from 'graphql'
import graphqlHTTP from 'express-graphql'

import {queryType} from './types'
import Adapter from './adapter'
import Context from './context'

export * from './types'
export * from './adapter'
export * from './context'

export interface HandlerOptions {
  adapter: Adapter
}

export const graphQLSchema = new GraphQLSchema({
  query: queryType
})

export function createAPIHandler(opts: HandlerOptions): RequestListener {
  return graphqlHTTP(req => ({
    schema: graphQLSchema,
    graphiql: true,
    context: {adapter: opts.adapter} as Context
  }))
}

export default createAPIHandler
