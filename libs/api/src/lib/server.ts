import {ApolloServer} from 'apollo-server-express'
import express, {Application, NextFunction, Request, Response} from 'express'
import pino from 'pino'
import pinoHttp from 'pino-http'
import {contextFromRequest, ContextOptions} from './context'
import {onInvoiceUpdate, onFindArticle, onFindPage} from './events'
import {GraphQLWepublishPublicSchema, GraphQLWepublishSchema} from './graphql/schema'
import {MAIL_WEBHOOK_PATH_PREFIX} from '@wepublish/mails'
import {PAYMENT_WEBHOOK_PATH_PREFIX, setupPaymentProvider} from './payments'
import {MAX_PAYLOAD_SIZE} from './utility'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled
} from 'apollo-server-core'
import {graphqlUploadExpress} from 'graphql-upload'
import {Context} from './context'
import {setupMailProvider} from './mails'
import {serverLogger, logger} from '@wepublish/utils'

declare global {
  // Workaround not working with let or const https://stackoverflow.com/questions/68481686/type-typeof-globalthis-has-no-index-signature
  // eslint-disable-next-line no-var
  var oldContext: Context
}

export interface WepublishServerOpts extends ContextOptions {
  readonly playground?: boolean
  readonly introspection?: boolean
  readonly logger?: pino.Logger
}

export class WepublishServer {
  constructor(private readonly opts: WepublishServerOpts, private app?: Application | undefined) {}

  async listen(port?: number, hostname?: string): Promise<void> {
    const app = this.app || express()

    this.setupPrismaMiddlewares()

    serverLogger.logger = this.opts.logger ? this.opts.logger : pino({name: 'we.publish'})

    const adminServer = new ApolloServer({
      schema: GraphQLWepublishSchema,
      plugins: [
        this.opts.playground
          ? ApolloServerPluginLandingPageGraphQLPlayground()
          : ApolloServerPluginLandingPageDisabled()
      ],
      introspection: this.opts.introspection ?? false,
      context: ({req}) => contextFromRequest(req, this.opts)
    })
    await adminServer.start()

    const publicServer = new ApolloServer({
      schema: GraphQLWepublishPublicSchema,
      plugins: [
        this.opts.playground
          ? ApolloServerPluginLandingPageGraphQLPlayground()
          : ApolloServerPluginLandingPageDisabled()
      ],
      introspection: this.opts.introspection ?? false,
      context: ({req}) => contextFromRequest(req, this.opts)
    })
    await publicServer.start()

    const corsOptions = {
      origin: true,
      credentials: true,
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

    app.use(
      pinoHttp({
        logger: serverLogger.logger,
        useLevel: 'debug'
      })
    )

    app.use(`/${MAIL_WEBHOOK_PATH_PREFIX}`, setupMailProvider(this.opts))
    app.use(`/${PAYMENT_WEBHOOK_PATH_PREFIX}`, setupPaymentProvider(this.opts))

    app.use(graphqlUploadExpress())

    adminServer.applyMiddleware({
      app,
      path: '/v1/admin',
      cors: corsOptions,
      bodyParserConfig: {limit: MAX_PAYLOAD_SIZE}
    })

    publicServer.applyMiddleware({
      app,
      path: '/v1',
      cors: corsOptions
    })

    app.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger('server').error(err)
      if (err.status) {
        res.status(err.status)
        res.send({error: err.message})
      } else {
        res.status(500).end()
      }
    })
    // Only as workaround until everything is migrated to NESTJS
    global.oldContext = await contextFromRequest(null, this.opts)
    this.app = app
  }

  private async setupPrismaMiddlewares(): Promise<void> {
    this.opts.prisma.$use(onFindArticle(this.opts.prisma))
    this.opts.prisma.$use(onFindPage(this.opts.prisma))

    const contextWithoutReq = await contextFromRequest(null, this.opts)
    this.opts.prisma.$use(onInvoiceUpdate(contextWithoutReq))
  }
}
