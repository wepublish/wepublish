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

let serverLogger: pino.Logger

export function logger(moduleName: string): pino.Logger {
  return serverLogger.child({module: moduleName})
}

export interface WepublishServerOpts extends ContextOptions {
  readonly playground?: boolean
  readonly introspection?: boolean
  readonly tracing?: boolean
  readonly logger?: pino.Logger
}

export class WepublishServer {
  private readonly app: Application

  constructor(private readonly opts: WepublishServerOpts) {
    const app = express()

    this.setupPrismaMiddlewares()

    serverLogger = opts.logger ? opts.logger : pino({name: 'we.publish'})

    const adminServer = new ApolloServer({
      schema: GraphQLWepublishSchema,
      playground: opts.playground ? {version: '1.7.27'} : false,
      introspection: opts.introspection ?? false,
      tracing: opts.tracing ?? false,
      context: ({req}) => contextFromRequest(req, this.opts)
    })

    const publicServer = new ApolloServer({
      schema: GraphQLWepublishPublicSchema,
      playground: opts.playground ? {version: '1.7.27'} : false,
      introspection: opts.introspection ?? false,
      tracing: opts.tracing ?? false,
      context: ({req}) => contextFromRequest(req, this.opts)
    })

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

    adminServer.applyMiddleware({
      app,
      path: '/admin',
      cors: corsOptions,
      bodyParserConfig: {limit: MAX_PAYLOAD_SIZE}
    })

    publicServer.applyMiddleware({
      app,
      path: '/',
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

  async listen(port?: number, hostname?: string): Promise<void> {
    this.app.listen(port ?? 4000, hostname ?? 'localhost')
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
