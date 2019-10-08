import {resolve} from 'path'
import {RequestListener, IncomingMessage, OutgoingMessage} from 'http'

import {GraphQLSchema, GraphQLObjectType} from 'graphql'
import createGraphQLHTTPHandler from 'express-graphql'
import {getDistDirectory, renderAltair, renderInitialOptions, RenderOptions} from 'altair-static'
import send from 'send'

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

export function faviconHandler(req: IncomingMessage, res: OutgoingMessage) {
  return send(req, resolve(__dirname, '../../../favicon.ico'), {maxAge: '1h'}).pipe(res)
}

export function graphQLPlaygroundHandler(req: IncomingMessage, res: OutgoingMessage) {}

export function defaultHandler(req: IncomingMessage, res: OutgoingMessage) {
  res.end()
}

export function createAPIHandler({adapter}: HandlerOptions): RequestListener {
  const graphQLHandler = createGraphQLHTTPHandler(req => ({
    schema: graphQLSchema,
    context(req: IncomingMessage): Context {
      return {
        adapter,
        user: adapter.resolveUserForToken(req.headers.authorization!)
      }
    }
  }))

  return (req, res) => {
    if (req.url!.endsWith('/favicon.ico')) {
      return faviconHandler(req, res)
    }

    if (req.url!.startsWith('/graphql')) {
      return graphQLHandler(req, res)
    }

    if (req.url!.startsWith('/playground')) {
      // return graphQLPlaygroundHandler()
    }

    return defaultHandler(req, res)
  }
}
