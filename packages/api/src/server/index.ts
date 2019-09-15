import {createReadStream} from 'fs'
import {resolve} from 'path'

import {RequestListener} from 'http'
import {GraphQLSchema, GraphQLObjectType} from 'graphql'
import graphqlHTTP from 'express-graphql'

import {GraphQLQuery, GraphQLMutation, GraphQLInputFooBlock, GraphQLInputBarBlock} from './graphql'
import {Adapter} from './adapter'
import {Context} from './context'

export * from './graphql'
export * from './adapter'
export * from './context'

export interface HandlerOptions {
  adapter: Adapter
  peerFetchTimeout: number
}

export const graphQLSchema = new GraphQLSchema({
  query: GraphQLQuery,
  mutation: GraphQLMutation as GraphQLObjectType,
  types: [GraphQLInputFooBlock, GraphQLInputBarBlock]
})

export function createAPIHandler(opts: HandlerOptions): RequestListener {
  const graphQLHandler = graphqlHTTP(req => ({
    schema: graphQLSchema,
    graphiql: true,
    context: {adapter: opts.adapter} as Context
  }))

  return (req, res) => {
    if (req.method === 'GET' && req.url && req.url.endsWith('/favicon.ico')) {
      res.setHeader('content-type', 'image/x-icon')
      res.setHeader('cache-control', 'public, max-age=3600')

      return createReadStream(resolve(__dirname, '../../../favicon.ico')).pipe(res)
    }

    return graphQLHandler(req, res)
  }
}
