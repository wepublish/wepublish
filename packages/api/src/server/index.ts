import {resolve} from 'path'
import {RequestListener, IncomingMessage, ServerResponse} from 'http'

import {GraphQLSchema, GraphQLObjectType} from 'graphql'
import createGraphQLHTTPHandler from 'express-graphql'
import send from 'send'

import {GraphQLQuery, GraphQLMutation, GraphQLInputFooBlock, GraphQLInputBarBlock} from './graphql'
import {Adapter} from './adapter'
import {contextFromRequest, Context} from './context'

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

export function faviconHandler(req: IncomingMessage, res: ServerResponse) {
  return send(req, resolve(__dirname, '../../../favicon.ico'), {maxAge: '1h'}).pipe(res)
}

export function createAPIHandler({adapter}: HandlerOptions): RequestListener {
  const graphQLHandler = createGraphQLHTTPHandler(req => ({
    schema: graphQLSchema,
    graphiql: true,
    context: contextFromRequest(req, {adapter})
  }))

  return ((req, res) => {
    if (req.url!.endsWith('/favicon.ico')) {
      return faviconHandler(req, res)
    }

    return graphQLHandler(req, res)
  }) as RequestListener
}
