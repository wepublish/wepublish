import {createReadStream} from 'fs'
import {resolve} from 'path'

import {RequestListener} from 'http'
import {GraphQLSchema, buildSchema, GraphQLObjectType} from 'graphql'
import graphqlHTTP from 'express-graphql'

import {queryType, mutationType} from './types'
import Adapter from './adapter'
import Context from './context'

export * from './types'
export * from './adapter'
export * from './context'

export interface HandlerOptions {
  adapter: Adapter
  peerFetchTimeout: number
}

export const graphQLSchema = new GraphQLSchema({
  query: queryType,
  mutation: mutationType as GraphQLObjectType
})

export function createAPIHandler(opts: HandlerOptions): RequestListener {
  const graphQLHandler = graphqlHTTP(req => ({
    schema: graphQLSchema,
    graphiql: true,
    context: {adapter: opts.adapter} as Context
  }))

  return (req, res) => {
    if (req.url && req.url.endsWith('/favicon.ico')) {
      res.setHeader('content-type', 'image/x-icon')
      res.setHeader('cache-control', 'public, max-age=3600')

      return createReadStream(resolve(__dirname, '../favicon.ico')).pipe(res)
    }

    return graphQLHandler(req, res)
  }
}

export default createAPIHandler
