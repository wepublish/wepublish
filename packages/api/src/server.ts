import express, {Application, NextFunction, Request, Response} from 'express'

import {ApolloServer} from 'apollo-server-express'

import {contextFromRequest, ContextOptions} from './context'
import {GraphQLWepublishSchema, GraphQLWepublishPublicSchema} from './graphql/schema'
import {MAIL_WEBHOOK_PATH_PREFIX, setupMailProvider} from './mails/mailProvider'
import {setupPaymentProvider, PAYMENT_WEBHOOK_PATH_PREFIX} from './payments/paymentProvider'
import {capitalizeFirstLetter, MAX_PAYLOAD_SIZE} from './utility'

import {methodsToProxy, PublishableModelEvents} from './events'
import {JobType, runJob} from './jobs'
import pino from 'pino'
import pinoHttp from 'pino-http'
import TypedEmitter from 'typed-emitter'

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
  private readonly opts: WepublishServerOpts

  constructor(opts: WepublishServerOpts) {
    const app = express()
    this.opts = opts
    const {dbAdapter} = opts

    serverLogger = opts.logger ? opts.logger : pino({name: 'we.publish'})

    methodsToProxy.forEach(mtp => {
      if (mtp.key in dbAdapter) {
        const dbAdapterKeyTyped = mtp.key as keyof typeof dbAdapter
        mtp.methods.forEach(method => {
          const adapter = dbAdapter[dbAdapterKeyTyped] as Record<string, Function | any>
          const methodName = `${method}${capitalizeFirstLetter(mtp.key)}`

          if (methodName in adapter) {
            adapter[methodName] = new Proxy(adapter[methodName], {
              // create proxy for method
              async apply(target: any, thisArg: any, argArray?: any): Promise<any> {
                const result = await target.bind(thisArg)(...argArray) // execute actual method "Create, Update, Publish, ..."
                setImmediate(async () => {
                  // make sure event gets executed in the next event loop
                  try {
                    logger('server').info('emitting event for %s', methodName)
                    ;(mtp.eventEmitter as TypedEmitter<PublishableModelEvents<unknown>>).emit(
                      method,
                      await contextFromRequest(null, opts),
                      result
                    ) // execute event emitter
                  } catch (error) {
                    logger('server').error(
                      error as object,
                      'error during emitting event for %s',
                      methodName
                    )
                  }
                })
                return result // return actual result "Article, Page, User, ..."
              }
            })
          } else {
            logger('server').warn('%s does not exist in dbAdapter[%s]', methodName, mtp.key)
          }
        })
      } else {
        logger('server').warn('%s does not exist in dbAdapter', mtp.key)
      }
    })

    const adminServer = new ApolloServer({
      schema: GraphQLWepublishSchema,
      playground: opts.playground ? {version: '1.7.27'} : false,
      introspection: opts.introspection ?? false,
      tracing: opts.tracing ?? false,
      context: ({req}) => contextFromRequest(req, opts)
    })

    const publicServer = new ApolloServer({
      schema: GraphQLWepublishPublicSchema,
      playground: opts.playground ? {version: '1.7.27'} : false,
      introspection: opts.introspection ?? false,
      tracing: opts.tracing ?? false,
      context: ({req}) => contextFromRequest(req, opts)
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

    app.use(`/${MAIL_WEBHOOK_PATH_PREFIX}`, setupMailProvider(opts))
    app.use(`/${PAYMENT_WEBHOOK_PATH_PREFIX}`, setupPaymentProvider(opts))

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
      logger('server').error(error, 'Error while running job "%s"', command)
    }
  }
}
