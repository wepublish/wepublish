import express, {Application} from 'express'

import {ApolloServer} from 'apollo-server-express'

import {contextFromRequest, ContextOptions} from './context'
import {GraphQLWepublishSchema, GraphQLWepublishPublicSchema} from './graphql/schema'
import {capitalizeFirstLetter} from './utility'

import eventEmitter from './events'

export interface WepublishServerOpts extends ContextOptions {
  readonly playground?: boolean
  readonly introspection?: boolean
  readonly tracing?: boolean
}

const methodsToProxy = [
  {
    key: 'user',
    methods: ['create', 'update', 'delete']
  },
  {
    key: 'article',
    methods: ['create', 'update', 'delete']
  }
]

export class WepublishServer {
  private readonly app: Application

  constructor(opts: WepublishServerOpts) {
    const app = express()

    const {dbAdapter} = opts

    methodsToProxy.forEach(mtp => {
      if (mtp.key in dbAdapter) {
        mtp.methods.forEach(method => {
          const methodName = `${method}${capitalizeFirstLetter(mtp.key)}`
          // @ts-ignore
          if (methodName in dbAdapter[mtp.key]) {
            // @ts-ignore
            dbAdapter[mtp.key][methodName] = new Proxy(dbAdapter[mtp.key][methodName], {
              async apply(target: any, thisArg: any, argArray?: any): Promise<any> {
                console.log(`PRE-${mtp.key}-${methodName}`)
                const result = await target.bind(thisArg)(...argArray)
                eventEmitter.emit(
                  `Post${capitalizeFirstLetter(methodName)}`,
                  await contextFromRequest(null, opts),
                  result
                )
                console.log(`POST-${mtp.key}-${methodName}`)
                return result
              }
            })
          }
        })
      }
    })

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
