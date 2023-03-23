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
import {PaymentPeriodicity, SubscriptionEvent} from '@prisma/client'

/**
 * Define GraphQL test queries and mutations.
 */
const getSubscriptionFlowsQuery = `
    query SubscriptionFlows($defaultFlowOnly: Boolean!) {
    subscriptionFlows(defaultFlowOnly: $defaultFlowOnly) {
      id
    }
  }
`
const createSubscriptionFlowMutation = `
  mutation Mutation($subscriptionFlow: SubscriptionFlowModelCreateInput!) {
    createSubscriptionFlow(subscriptionFlow: $subscriptionFlow) {
      id
    }
  }
`
const updateSubscriptionFlowMutation = `
  mutation UpdateSubscriptionFlow($subscriptionFlow: SubscriptionFlowModelUpdateInput!) {
  updateSubscriptionFlow(subscriptionFlow: $subscriptionFlow) {
    id
  }
}
`

const deleteSubscriptionFlowMutation = `
  mutation UpdateSubscriptionFlow($subscriptionFlowId: Int!) {
  deleteSubscriptionFlow(subscriptionFlowId: $subscriptionFlowId) {
    id
  }
}
`

const createSubscriptionIntervalMutation = `
  mutation CreateSubscriptionInterval($subscriptionInterval: SubscriptionIntervalCreateInput!) {
    createSubscriptionInterval(subscriptionInterval: $subscriptionInterval) {
      id
    }
  }
`
const updateSubscriptionIntervals = `
  mutation UpdateSubscriptionIntervals($subscriptionIntervals: [SubscriptionIntervalUpdateInput!]!) {
    updateSubscriptionIntervals(subscriptionIntervals: $subscriptionIntervals) {
      id
    }
  }
`
const updateSubscriptionInterval = `
  mutation UpdateSubscriptionInterval($subscriptionInterval: SubscriptionIntervalUpdateInput!) {
    updateSubscriptionInterval(subscriptionInterval: $subscriptionInterval) {
      id
    }
  }
`
const paymentMethodsQuery = `
  query PaymentMethods {
    paymentMethods {
      id
    }
  }
`

/**
 * Create App module to be able to create a NestJs application
 */
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

describe('Subscription Flow Resolver', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule]
    }).compile()
    app = module.createNestApplication()
    await app.init()
  })

  afterAll(async () => {
    await app.close()
  })

  it('subscriptionFlows are not public', () => {
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
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('createSubscriptionFlow is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: createSubscriptionFlowMutation,
        variables: {
          subscriptionFlow: {
            autoRenewal: true,
            memberPlanId: 'abc',
            paymentMethodIds: ['abc'],
            periodicities: [PaymentPeriodicity.monthly]
          }
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('updateSubscriptionFlow is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: updateSubscriptionFlowMutation,
        variables: {
          subscriptionFlow: {
            id: 1,
            autoRenewal: true,
            paymentMethodIds: ['abc'],
            periodicities: [PaymentPeriodicity.monthly]
          }
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('deleteSubscriptionFlow is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: deleteSubscriptionFlowMutation,
        variables: {
          subscriptionFlowId: 1
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('createSubscriptionInterval is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: createSubscriptionIntervalMutation,
        variables: {
          subscriptionInterval: {
            daysAwayFromEnding: 1,
            event: SubscriptionEvent.CUSTOM,
            mailTemplateId: 1,
            subscriptionFlowId: 1
          }
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('updateSubscriptionIntervals is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: updateSubscriptionIntervals,
        variables: {
          subscriptionIntervals: [
            {
              id: 1,
              daysAwayFromEnding: 1,
              mailTemplateId: 1
            }
          ]
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('updateSubscriptionInterval is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: updateSubscriptionInterval,
        variables: {
          subscriptionInterval: {
            id: 1,
            daysAwayFromEnding: 1,
            mailTemplateId: 1
          }
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('deleteSubscriptionInterval is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: updateSubscriptionInterval,
        variables: {
          subscriptionInterval: {
            id: 1
          }
        }
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })

  it('paymentMethods is not public', () => {
    return request(app.getHttpServer())
      .post('')
      .send({
        query: paymentMethodsQuery
      })
      .expect(200)
      .expect(({body}) => {
        expect(!!body.errors.find((error: any) => error.message === 'Forbidden resource')).toEqual(
          true
        )
        expect(body.data).toBeNull()
      })
  })
})
