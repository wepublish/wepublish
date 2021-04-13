import express, {Application, NextFunction} from 'express'
import {ApolloServer} from 'apollo-server-express'
import {contextFromRequest, ContextOptions} from './context'
import {getGraphQLWepublishSchemas} from './graphql/schema'
import {MAIL_WEBHOOK_PATH_PREFIX, setupMailProvider} from './mails/mailProvider'
import {setupPaymentProvider, PAYMENT_WEBHOOK_PATH_PREFIX} from './payments/paymentProvider'
import {capitalizeFirstLetter} from './utility'
import {methodsToProxy} from './events'
import {JobType, runJob} from './jobs'
import pino from 'pino'
import pinoHttp from 'pino-http'

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
    const {dbAdapter, customGraphQLSchema} = opts

    serverLogger = opts.logger ? opts.logger : pino({name: 'we.publish'})

    methodsToProxy.forEach(mtp => {
      if (mtp.key in dbAdapter) {
        mtp.methods.forEach(method => {
          const methodName = `${method}${capitalizeFirstLetter(mtp.key)}`
          // @ts-ignore
          if (methodName in dbAdapter[mtp.key]) {
            // @ts-ignore
            dbAdapter[mtp.key][methodName] = new Proxy(dbAdapter[mtp.key][methodName], {
              // create proxy for method
              async apply(target: any, thisArg: any, argArray?: any): Promise<any> {
                const result = await target.bind(thisArg)(...argArray) // execute actual method "Create, Update, Publish, ..."
                setImmediate(async () => {
                  // make sure event gets executed in the next event loop
                  try {
                    logger('server').info('emitting event for %s', methodName)
                    // @ts-ignore
                    mtp.eventEmitter.emit(method, await contextFromRequest(null, opts), result) // execute event emitter
                  } catch (error) {
                    logger('server').error(error, 'error during emitting event for %s', methodName)
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

    const {privateSchema, publicSchema} = getGraphQLWepublishSchemas(opts)

    const adminServer = new ApolloServer({
      schema: privateSchema,
      playground: opts.playground ?? false,
      introspection: opts.introspection ?? false,
      tracing: opts.tracing ?? false,
      context: ({req}) => contextFromRequest(req, opts)
    })

    const publicServer = new ApolloServer({
      schema: publicSchema,
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
      cors: corsOptions
    })

    if (customGraphQLSchema) {
      const customServer = new ApolloServer({
        schema: customGraphQLSchema,
        playground: opts.playground ?? false,
        introspection: opts.introspection ?? false,
        tracing: opts.tracing ?? false,
        context: ({req}) => contextFromRequest(req, opts)
      })
      customServer.applyMiddleware({
        app,
        path: '/custom',
        cors: corsOptions
      })
    }

    publicServer.applyMiddleware({
      app,
      path: '/',
      cors: corsOptions
    })

    app.use((err: any, req: Express.Request, res: Express.Response, next: NextFunction) => {
      logger('server').error(err)
      return next(err)
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
    } catch (error) {
      logger('server').error(error, 'Error while running job "%s"', command)
    }
  }
}
