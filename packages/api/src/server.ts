import express from 'express'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import {Application} from 'express'

import {ApolloServer} from 'apollo-server-express'

import {contextFromRequest, ContextOptions} from './context'
import {GraphQLWepublishSchema, GraphQLWepublishPublicSchema} from './graphql/schema'

import auth from './auth'
//

export interface WepublishServerOpts extends ContextOptions {
  readonly playground?: boolean
  readonly introspection?: boolean
  readonly tracing?: boolean
}

export class WepublishServer {
  private readonly app: Application

  constructor(opts: WepublishServerOpts) {
    const app = express()

    app.use(bodyParser.urlencoded({extended: true}))
    app.use(cookieParser())
    app.all('*', async (req, res, next) => {
      //@ts-ignore
      req.wpContext = await contextFromRequest(req, opts)
      next()
    })

    app.use('/auth', auth)

    const adminServer = new ApolloServer({
      schema: GraphQLWepublishSchema,
      playground: opts.playground ?? false,
      introspection: opts.introspection ?? false,
      tracing: opts.tracing ?? false,
      context: ({req}) => contextFromRequest(req, opts)
    })

    const publicServer = new ApolloServer({
      schema: GraphQLWepublishPublicSchema,
      playground: opts.playground ?? false,
      introspection: opts.introspection ?? false,
      tracing: opts.tracing ?? false,
      context: ({req}) => contextFromRequest(req, opts)
    })

    const corsOptions = {
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
    }

    adminServer.applyMiddleware({
      app,
      path: '/admin',
      cors: corsOptions
    })

    publicServer.applyMiddleware({
      app,
      path: '/',
      cors: corsOptions
    })

    this.app = app
  }

  async listen(port?: number, hostname?: string): Promise<void> {
    this.app.listen(port ?? 4000, hostname ?? 'localhost')
  }
}
