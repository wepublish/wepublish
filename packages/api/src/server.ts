import {ApolloServer} from 'apollo-server'

import {contextFromRequest, ContextOptions} from './context'
import {GraphQLWepublishSchema} from './graphql/schema'

export interface WepublishServerOpts extends ContextOptions {}

export class WepublishServer {
  private readonly apolloServer: ApolloServer

  constructor(opts: WepublishServerOpts) {
    this.apolloServer = new ApolloServer({
      schema: GraphQLWepublishSchema,

      cors: {
        origin: '*',
        allowedHeaders: [
          'authorization',
          'content-type',
          'content-length',
          'accept',
          'origin',
          'user-agent'
        ],
        methods: ['POST', 'GET', 'OPTIONS']
      },

      introspection: true,
      tracing: true,

      context: ({req}) => contextFromRequest(req, opts)
    })
  }

  async listen(port?: number, hostname?: string): Promise<void> {
    this.apolloServer.listen(port ?? 4000, hostname)
  }
}
