import {ApolloServer} from 'apollo-server-express'
import express, {Application, NextFunction, Request, Response} from 'express'
import pino from 'pino'
import pinoHttp from 'pino-http'
import {contextFromRequest, ContextOptions} from './context'
import {onFindArticle, onFindPage} from './events'
import {GraphQLWepublishPublicSchema, GraphQLWepublishSchema} from './graphql/schema'
import {MAIL_WEBHOOK_PATH_PREFIX} from '@wepublish/mail/api'
import {PAYMENT_WEBHOOK_PATH_PREFIX, setupPaymentProvider} from './payments'
import {MAX_PAYLOAD_SIZE} from './utility'
import {
  ApolloServerPluginLandingPageGraphQLPlayground,
  ApolloServerPluginLandingPageDisabled
} from 'apollo-server-core'
import {graphqlUploadExpress} from 'graphql-upload'
import {setupMailProvider} from './mails'
import {serverLogger, setLogger, logger} from '@wepublish/utils/api'
import {graphQLJSSchemaToAST} from '@apollo/federation-internals'
import {buildSubgraphSchema} from '@apollo/subgraph'
import gql from 'graphql-tag'
import {GraphQLPublicPageResolver} from './graphql/page'
import {GraphQLTagResolver} from './graphql/tag/tag'
import {GraphQLImageResolver} from './graphql/image'
import {GraphQLObjectType, GraphQLUnionType, printSchema} from 'graphql'
import {GraphQLEventResolver} from './graphql/event/event'
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

    this.setupPrismaMiddlewares()
    setLogger(this.opts.logger)

    const adminServer = new ApolloServer({
      schema: GraphQLWepublishSchema,
      plugins: [
        this.opts.playground
          ? ApolloServerPluginLandingPageGraphQLPlayground()
          : ApolloServerPluginLandingPageDisabled()
      ],
      introspection: true,
      context: ({req}) => contextFromRequest(req, this.opts)
    })

    await fs.promises.writeFile(
      './apps/api-example/schema-v1-admin.graphql',
      printSchema(GraphQLWepublishSchema)
    )

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

      extend type Page @key(fields: "id")
      extend type Tag @key(fields: "id")
      extend type Image @key(fields: "id")
      extend type Event @key(fields: "id")
      extend type PaymentMethod @key(fields: "id")
      extend type MemberPlan @key(fields: "id")
      extend type User @key(fields: "id")
      extend type PollVote @key(fields: "id")
    `
    const typeDefs = [graphQLJSSchemaToAST(GraphQLWepublishPublicSchema), federatedTypeDefs]
    const resolvers = {
      ...Object.fromEntries(
        Object.values(GraphQLWepublishPublicSchema.getTypeMap())
          .filter(type => type instanceof GraphQLObjectType || type instanceof GraphQLUnionType)
          .map(type => {
            const resolvers = {}
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
                resolvers['__resolveType'] = (source, context, info) => {
                  return type
                    .getTypes()
                    .find(type => type.isTypeOf && type.isTypeOf(source, context, info)).name
                }
              }
            }

            return [type.name, resolvers]
          })
          .filter(([name, resolvers]) => Object.keys(resolvers).length > 0)
      )
    }
    const federatedResolvers = {
      Page: GraphQLPublicPageResolver,
      Tag: GraphQLTagResolver,
      Image: GraphQLImageResolver,
      Event: GraphQLEventResolver
    }
    for (const type in federatedResolvers) {
      resolvers[type] = {...resolvers[type], ...federatedResolvers[type]}
    }

    const publicServer = new ApolloServer({
      schema: buildSubgraphSchema({
        typeDefs,
        resolvers
      }),
      introspection: this.opts.introspection ?? false,
      context: ({req}) => contextFromRequest(req, this.opts),
      allowBatchedHttpRequests: true
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

  private async setupPrismaMiddlewares(): Promise<void> {
    this.opts.prisma.$use(onFindArticle(this.opts.prisma))
    this.opts.prisma.$use(onFindPage(this.opts.prisma))
  }
}
