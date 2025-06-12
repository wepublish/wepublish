import {ApolloServer} from 'apollo-server-express'
import express, {Application, NextFunction, Request, Response} from 'express'
import pino from 'pino'
import pinoHttp from 'pino-http'
import {contextFromRequest, ContextOptions} from './context'
import {GraphQLWepublishPublicSchema, GraphQLWepublishSchema} from './graphql/schema'
import {MAIL_WEBHOOK_PATH_PREFIX} from '@wepublish/mail/api'
import {PAYMENT_WEBHOOK_PATH_PREFIX, setupPaymentProvider} from './payments'
import {
  ApolloServerPluginLandingPageDisabled,
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginUsageReportingDisabled
} from 'apollo-server-core'
import {graphqlUploadExpress} from 'graphql-upload'
import {setupMailProvider} from './mails'
import {logger, MAX_PAYLOAD_SIZE, serverLogger, setLogger} from '@wepublish/utils/api'
import {graphQLJSSchemaToAST} from '@apollo/federation-internals'
import {buildSubgraphSchema} from '@apollo/subgraph'
import gql from 'graphql-tag'
import {GraphQLObjectType, GraphQLUnionType, printSchema} from 'graphql'
import * as fs from 'fs'

export interface WepublishServerOpts extends ContextOptions {
  readonly playground?: boolean
  readonly introspection?: boolean
  readonly logger?: pino.Logger
}

export class WepublishServer {
  constructor(
    private readonly opts: WepublishServerOpts,
    private privateApp?: Application | undefined,
    private publicApp?: Application | undefined
  ) {}

  async listen(port?: number, hostname?: string): Promise<void> {
    if (!this.publicApp) {
      this.publicApp = express()
    }
    if (!this.privateApp) {
      this.privateApp = express()
    }
    const publicApp = this.publicApp
    const privateApp = this.privateApp

    setLogger(this.opts.logger)

    const adminServer = new ApolloServer({
      schema: GraphQLWepublishSchema,
      plugins: [
        ApolloServerPluginUsageReportingDisabled(),
        this.opts.playground
          ? ApolloServerPluginLandingPageGraphQLPlayground()
          : ApolloServerPluginLandingPageDisabled()
      ],
      introspection: true,
      context: ({req}) => contextFromRequest(req, this.opts)
    })

    if (process.env['NODE_ENV'] !== 'production') {
      await fs.promises.writeFile(
        './apps/api-example/schema-v1-admin.graphql',
        printSchema(GraphQLWepublishSchema)
      )
    }

    await adminServer.start()

    const federatedTypeDefs = gql`
      directive @extends on INTERFACE | OBJECT
      directive @external on FIELD_DEFINITION | OBJECT
      directive @inaccessible on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION
      directive @key(fields: String!, resolvable: Boolean = true) repeatable on INTERFACE | OBJECT
      directive @override(from: String!) on FIELD_DEFINITION
      directive @provides(fields: String!) on FIELD_DEFINITION
      directive @requires(fields: String!) on FIELD_DEFINITION
      directive @shareable on FIELD_DEFINITION | OBJECT
      directive @tag(
        name: String!
      ) repeatable on ARGUMENT_DEFINITION | ENUM | ENUM_VALUE | FIELD_DEFINITION | INPUT_FIELD_DEFINITION | INPUT_OBJECT | INTERFACE | OBJECT | SCALAR | UNION
    `
    const typeDefs = [graphQLJSSchemaToAST(GraphQLWepublishPublicSchema), federatedTypeDefs]
    const resolvers = {
      ...Object.fromEntries(
        Object.values(GraphQLWepublishPublicSchema.getTypeMap())
          .filter(type => type instanceof GraphQLObjectType || type instanceof GraphQLUnionType)
          .map(type => {
            const resolvers = {} as any

            if (type instanceof GraphQLObjectType) {
              const fields = type.getFields()
              for (const name in fields) {
                if (fields[name] && fields[name].resolve) {
                  resolvers[name] = fields[name].resolve
                }
              }

              if (type.isTypeOf) {
                resolvers['isTypeOf'] = type.isTypeOf
              }
            }

            if (type instanceof GraphQLUnionType) {
              if (type.resolveType) {
                resolvers['__resolveType'] = type.resolveType
              } else {
                resolvers['__resolveType'] = (source: any, context: any, info: any) => {
                  return type
                    .getTypes()
                    .find(type => type.isTypeOf && type.isTypeOf(source, context, info))?.name
                }
              }
            }

            return [type.name, resolvers]
          })
          .filter(([name, resolvers]) => Object.keys(resolvers).length > 0)
      )
    }

    const publicSchema = buildSubgraphSchema({
      typeDefs,
      resolvers
    })

    const publicServer = new ApolloServer({
      schema: publicSchema,
      introspection: this.opts.introspection ?? false,
      context: ({req}) => contextFromRequest(req, this.opts),
      allowBatchedHttpRequests: true
    })

    if (process.env['NODE_ENV'] !== 'production') {
      await fs.promises.writeFile('./apps/api-example/schema-v1.graphql', printSchema(publicSchema))
    }

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

    publicApp.use(
      pinoHttp({
        logger: serverLogger.logger,
        useLevel: 'debug'
      })
    )

    publicApp.use(`/${MAIL_WEBHOOK_PATH_PREFIX}`, setupMailProvider(this.opts))
    publicApp.use(`/${PAYMENT_WEBHOOK_PATH_PREFIX}`, setupPaymentProvider(this.opts))

    publicApp.use(graphqlUploadExpress())

    adminServer.applyMiddleware({
      app: publicApp,
      path: '/v1/admin',
      cors: corsOptions,
      bodyParserConfig: {limit: MAX_PAYLOAD_SIZE}
    })

    publicServer.applyMiddleware({
      app: privateApp,
      path: '/v1',
      cors: corsOptions
    })

    publicApp.use((err: any, req: Request, res: Response, next: NextFunction) => {
      logger('server').error(err)
      if (err.status) {
        res.status(err.status)
        res.send({error: err.message})
      } else {
        res.status(500).end()
      }
    })
  }
}
