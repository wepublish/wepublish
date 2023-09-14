import {ApolloServer} from 'apollo-server-express'
import express, {Application, NextFunction, Request, Response} from 'express'
import pino from 'pino'
import pinoHttp from 'pino-http'
import {contextFromRequest, ContextOptions} from './context'
import {onInvoiceUpdate, onFindArticle, onFindPage} from './events'
import {GraphQLWepublishPublicSchema, GraphQLWepublishSchema} from './graphql/schema'
import {JobType, runJob} from './jobs'
import {MAIL_WEBHOOK_PATH_PREFIX, setupMailProvider} from './mails/mailProvider'
import {PAYMENT_WEBHOOK_PATH_PREFIX, setupPaymentProvider} from './payments/paymentProvider'
import {MAX_PAYLOAD_SIZE} from './utility'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled
} from 'apollo-server-core'
import {graphqlUploadExpress} from 'graphql-upload'

let serverLogger: pino.Logger

export function logger(moduleName: string): pino.Logger {
  return serverLogger.child({module: moduleName})
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

    serverLogger = this.opts.logger ? this.opts.logger : pino({name: 'we.publish'})

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
        logger: serverLogger,
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

    this.app = app
  }

  async runJob(command: JobType, data: any): Promise<void> {
    try {
      const context = await contextFromRequest(null, this.opts)
      await runJob(command, context, data)

      // FIXME: Will be refactored in WPC-604
      // Wait for all asynchronous events to finish. I know this is bad code.
      await new Promise(resolve => setTimeout(resolve, 10000))
    } catch (error) {
      logger('server').error(error as Error, 'Error while running job "%s"', command)
    }
  }

  private async setupPrismaMiddlewares(): Promise<void> {
    this.opts.prisma.$use(onFindArticle(this.opts.prisma))
    this.opts.prisma.$use(onFindPage(this.opts.prisma))

    const contextWithoutReq = await contextFromRequest(null, this.opts)
    this.opts.prisma.$use(onInvoiceUpdate(contextWithoutReq))
  }
}
