import {INestApplication, Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {PrismaModule} from '@wepublish/nest-modules'
import {Test, TestingModule} from '@nestjs/testing'
import request from 'supertest'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {OldContextService, PrismaService} from '@wepublish/api'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {PermissionsGuard} from '@wepublish/permissions/api'
import {APP_GUARD} from '@nestjs/core'
import {SubscriptionFlowHelper} from './subscription-flow.helper'

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/'
    }),
    PrismaModule
  ],
  providers: [
    SubscriptionFlowResolver,
    PrismaService,
    SubscriptionFlowController,
    OldContextService,
    PeriodicJobController,
    SubscriptionController,
    SubscriptionFlowHelper,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard
    }
  ]
})
export class AppModule {}

const getSubscriptionFlowsQuery = `
    query SubscriptionFlows($defaultFlowOnly: Boolean!) {
    subscriptionFlows(defaultFlowOnly: $defaultFlowOnly) {
      id
    }
  }
`

describe('Subscription Flow Resolver', () => {
  let app: INestApplication

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = moduleFixture.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('flows are not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: getSubscriptionFlowsQuery,
        variables: {
          defaultFlowOnly: false
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(body.data).toBeNull()
      })
  })

  it('flows are accessible with CanGetSubscriptionFlows permission', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: getSubscriptionFlowsQuery,
        variables: {
          defaultFlowOnly: false
        }
      })
      .expect(200)
      .expect(({body}) => {
        console.log(body)
        expect(body.data).toBeTruthy()
      })
  })
})
