import {CanActivate, ExecutionContext, INestApplication, Injectable, Module} from '@nestjs/common'
import {GraphQLModule} from '@nestjs/graphql'
import {ApolloDriver, ApolloDriverConfig} from '@nestjs/apollo'
import {PrismaModule} from '@wepublish/nest-modules'
import {Test, TestingModule} from '@nestjs/testing'
import request from 'supertest'
import {SubscriptionFlowResolver} from './subscription-flow.resolver'
import {SubscriptionFlowController} from './subscription-flow.controller'
import {OldContextService, PrismaService} from '@wepublish/nest-modules'
import {PeriodicJobController} from '../periodic-job/periodic-job.controller'
import {SubscriptionController} from '../subscription/subscription.controller'
import {APP_GUARD} from '@nestjs/core'
import {SubscriptionFlowHelper} from './subscription-flow.helper'
import {PaymentPeriodicity, PrismaClient, SubscriptionEvent} from '@prisma/client'
import {
  initialize,
  defineMemberPlanFactory,
  defineSubscriptionFlowFactory,
  definePaymentMethodFactory
} from '@wepublish/api'
import {PermissionsGuard} from '@wepublish/permissions/api'
import {clearDatabase} from '../../prisma-utils'
import {initOldContextForTest} from '../../oldcontext-utils'

@Injectable()
export class TestPermissionsGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    return true
  }
}

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
export class AppUnauthenticatedModule {}
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
      useClass: TestPermissionsGuard
    }
  ]
})
export class AppAuthenticatedModule {}

describe('Subscription Flow Resolver', () => {
  describe('unauthenticated', () => {
    let app: INestApplication

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AppUnauthenticatedModule]
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
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
          expect(
            !!body.errors.find((error: any) => error.message === 'Forbidden resource')
          ).toEqual(true)
          expect(body.data).toBeNull()
        })
    })
  })

  describe('authenticated', () => {
    let resolver: SubscriptionFlowResolver

    const prismaClient = new PrismaClient()
    initialize({prisma: prismaClient})

    const PaymentMethodFactory = definePaymentMethodFactory()
    const MemberPlanFactory = defineMemberPlanFactory()
    const SubscriptionFlowFactory = defineSubscriptionFlowFactory({
      defaultData: {
        memberPlan: MemberPlanFactory
      }
    })

    beforeEach(async () => {
      await initOldContextForTest(prismaClient)
      const module: TestingModule = await Test.createTestingModule({
        imports: [PrismaModule.forTest(prismaClient)],
        providers: [
          OldContextService,
          PeriodicJobController,
          PrismaService,
          SubscriptionController,
          SubscriptionFlowController,
          SubscriptionFlowHelper,
          SubscriptionFlowResolver
        ]
      }).compile()

      resolver = module.get<SubscriptionFlowResolver>(SubscriptionFlowResolver)

      await clearDatabase(prismaClient, [
        'subscription_communication_flows',
        'payment.methods',
        'member.plans',
        'subscriptions.intervals',
        'mail_templates'
      ])
    })

    afterEach(async () => {
      await prismaClient.$disconnect()
    })

    it('includes number of subscriptions', async () => {
      const plan = await MemberPlanFactory.create()
      await SubscriptionFlowFactory.create({
        default: true,
        memberPlan: {connect: {id: plan.id}}
      })

      const response = await resolver.subscriptionFlows(false, plan.id)
      expect(response.length).toEqual(1)
      expect(response[0].numberOfSubscriptions).toEqual(0)
    })

    it('returns subscription flows for all queries and mutations', async () => {
      const plan = await MemberPlanFactory.create()
      const flow = await SubscriptionFlowFactory.create({
        default: true,
        memberPlan: {connect: {id: plan.id}}
      })
      const paymentMethod = await PaymentMethodFactory.create()

      expect((await resolver.subscriptionFlows(false, plan.id)).length).toEqual(1)

      expect(
        (
          await resolver.createSubscriptionFlow({
            memberPlanId: plan.id,
            paymentMethodIds: [paymentMethod.id],
            periodicities: [PaymentPeriodicity.biannual],
            autoRenewal: [true]
          })
        ).length
      ).toEqual(2)

      expect(
        (
          await resolver.updateSubscriptionFlow({
            id: flow.id,
            paymentMethodIds: [paymentMethod.id],
            periodicities: [PaymentPeriodicity.monthly],
            autoRenewal: [true]
          })
        ).length
      ).toEqual(2)

      const allFlows = await resolver.subscriptionFlows(false, plan.id)
      expect((await resolver.deleteSubscriptionFlow(allFlows[1].id)).length).toEqual(1)
    })
  })
})
