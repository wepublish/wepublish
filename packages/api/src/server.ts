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
import {PrismaClient} from '@prisma/client'

let serverLogger: pino.Logger

export function logger(moduleName: string): pino.Logger {
  return serverLogger.child({module: moduleName})
}

export interface WepublishServerOpts extends ContextOptions {
  readonly mongoUrl: string
  readonly playground?: boolean
  readonly introspection?: boolean
  readonly tracing?: boolean
  readonly logger?: pino.Logger
}

export class WepublishServer {
  private readonly app: Application
  private opts: WepublishServerOpts

  constructor(opts: Omit<WepublishServerOpts, 'prisma'>) {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: opts.mongoUrl
        }
      }
    })
    prisma.$connect()

    // @TODO: move into cron job
    prisma.$use(async (args, next) => {
      if (!(args.model === 'Article' && args.action.startsWith('find'))) {
        return next(args)
      }

      // skip the call inside this middleware to not create an infinite loop
      if (args.args?.where?.pending?.is?.AND?.publishAt?.lte) {
        return next(args)
      }

      const articles = await prisma.article.findMany({
        where: {
          pending: {
            is: {
              AND: {
                publishAt: {
                  lte: new Date()
                }
              }
            }
          }
        }
      })

      await Promise.all(
        articles.map(({id, pending}) =>
          prisma.article.update({
            where: {
              id
            },
            data: {
              modifiedAt: new Date(),
              pending: null,
              published: pending
            }
          })
        )
      )

      return next(args)
    })

    // @TODO: move into cron job
    prisma.$use(async (args, next) => {
      if (!(args.model === 'Page' && args.action.startsWith('find'))) {
        return next(args)
      }

      // skip the call inside this middleware to not create an infinite loop
      if (args.args?.where?.pending?.is?.AND?.publishAt?.lte) {
        return next(args)
      }

      const pages = await prisma.page.findMany({
        where: {
          pending: {
            is: {
              AND: {
                publishAt: {
                  lte: new Date()
                }
              }
            }
          }
        }
      })

      await Promise.all(
        pages.map(({id, pending}) =>
          prisma.page.update({
            where: {
              id
            },
            data: {
              modifiedAt: new Date(),
              pending: null,
              published: pending
            }
          })
        )
      )

      return next(args)
    })

    this.opts = {...opts, prisma}
    const app = express()

    const {dbAdapter} = opts

    serverLogger = opts.logger ? opts.logger : pino({name: 'we.publish'})

    methodsToProxy.forEach(mtp => {
      if (mtp.key in dbAdapter) {
        const dbAdapterKeyTyped = mtp.key as keyof typeof dbAdapter
        mtp.methods.forEach(method => {
          const adapter = dbAdapter[dbAdapterKeyTyped] as Record<string, any>
          const methodName = `${method}${capitalizeFirstLetter(mtp.key)}`

          if (methodName in adapter) {
            adapter[methodName] = new Proxy(adapter[methodName], {
              // create proxy for method
              apply: async (target: any, thisArg: any, argArray?: any): Promise<any> => {
                const result = await target.bind(thisArg)(...argArray) // execute actual method "Create, Update, Publish, ..."
                setImmediate(async () => {
                  // make sure event gets executed in the next event loop
                  try {
                    logger('server').info('emitting event for %s', methodName)
                    ;(mtp.eventEmitter as TypedEmitter<PublishableModelEvents<unknown>>).emit(
                      method,
                      await contextFromRequest(null, this.opts),
                      result
                    ) // execute event emitter
                  } catch (error) {
                    logger('server').error(
                      error as Error,
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
}
