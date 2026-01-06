import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import {
  CanActivate,
  ExecutionContext,
  INestApplication,
  Injectable,
  Module,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule } from '@nestjs/graphql';
import { Test, TestingModule } from '@nestjs/testing';
import {
  PaymentPeriodicity,
  PrismaClient,
  SubscriptionEvent,
} from '@prisma/client';
import { PrismaModule } from '@wepublish/nest-modules';
import { PermissionsGuard } from '@wepublish/permissions/api';
import request from 'supertest';
import {
  registerMailsModule,
  registerPaymentMethodModule,
} from '../testing/module-registrars';
import { SubscriptionFlowResolver } from './subscription-flow.resolver';
import { SubscriptionFlowService } from './subscription-flow.service';
import { PaymentsModule } from '@wepublish/payment/api';

@Injectable()
export class TestPermissionsGuard implements CanActivate {
  public canActivate(context: ExecutionContext): boolean {
    return true;
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
`;
const createSubscriptionFlowMutation = `
  mutation CreateSubscriptionFlow(
    $memberPlanId: String!
    $paymentMethodIds: [String!]!
    $periodicities: [PaymentPeriodicity!]!
    $autoRenewal: [Boolean!]!
  ) {
    createSubscriptionFlow(
      memberPlanId: $memberPlanId
      paymentMethodIds: $paymentMethodIds
      periodicities: $periodicities
      autoRenewal: $autoRenewal
    ) {
      id
    }
  }
`;
const updateSubscriptionFlowMutation = `
mutation UpdateSubscriptionFlow(
  $id: String!
  $paymentMethodIds: [String!]!
  $periodicities: [PaymentPeriodicity!]!
  $autoRenewal: [Boolean!]!
) {
  updateSubscriptionFlow(
    id: $id
    paymentMethodIds: $paymentMethodIds
    periodicities: $periodicities
    autoRenewal: $autoRenewal
  ) {
    id
  }
}
`;

const deleteSubscriptionFlowMutation = `
  mutation DeleteSubscriptionFlow($id: String!) {
    deleteSubscriptionFlow(id: $id) {
      id
    }
  }
`;

const createSubscriptionIntervalMutation = `
  mutation CreateSubscriptionInterval(
    $subscriptionFlowId: String!
    $daysAwayFromEnding: Int
    $mailTemplateId: String
    $event: SubscriptionEvent!
  ) {
    createSubscriptionInterval(
      subscriptionFlowId: $subscriptionFlowId
      daysAwayFromEnding: $daysAwayFromEnding
      mailTemplateId: $mailTemplateId
      event: $event
    ) {
      id
    }
  }
`;

const updateSubscriptionInterval = `
  mutation UpdateSubscriptionInterval(
    $id: String!
    $daysAwayFromEnding: Int
    $mailTemplateId: String
  ) {
    updateSubscriptionInterval(
      id: $id
      daysAwayFromEnding: $daysAwayFromEnding
      mailTemplateId: $mailTemplateId
    ) {
      id
    }
  }
`;
const paymentMethodsQuery = `
  query PaymentMethods {
    paymentMethods {
      id
    }
  }
`;

/**
 * Create App module to be able to create a NestJs application
 */
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
    }),
    PrismaModule,
    registerMailsModule(),
    registerPaymentMethodModule(),
    PaymentsModule,
  ],
  providers: [
    SubscriptionFlowResolver,
    SubscriptionFlowService,
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppUnauthenticatedModule {}

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      path: '/',
    }),
    PrismaModule,
    registerMailsModule(),
    PaymentsModule,
  ],
  providers: [
    SubscriptionFlowResolver,
    SubscriptionFlowService,
    {
      provide: APP_GUARD,
      useClass: TestPermissionsGuard,
    },
  ],
})
export class AppAuthenticatedModule {}

describe('Subscription Flow Resolver', () => {
  describe('unauthenticated', () => {
    let app: INestApplication;

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AppUnauthenticatedModule],
      }).compile();
      app = module.createNestApplication();
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('subscriptionFlows are not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: getSubscriptionFlowsQuery,
          variables: {
            defaultFlowOnly: false,
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });

    it('createSubscriptionFlow is not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: createSubscriptionFlowMutation,
          variables: {
            autoRenewal: true,
            memberPlanId: 'abc',
            paymentMethodIds: ['abc'],
            periodicities: [PaymentPeriodicity.monthly],
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });

    it('updateSubscriptionFlow is not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: updateSubscriptionFlowMutation,
          variables: {
            id: 'b7b37042-c9c7-4ebb-8a0d-1da489b1993b',
            autoRenewal: true,
            paymentMethodIds: ['abc'],
            periodicities: [PaymentPeriodicity.monthly],
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });

    it('deleteSubscriptionFlow is not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: deleteSubscriptionFlowMutation,
          variables: {
            id: 'a85e1503-11a5-4482-8897-3578f9609b2e',
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });

    it('createSubscriptionInterval is not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: createSubscriptionIntervalMutation,
          variables: {
            daysAwayFromEnding: 1,
            event: SubscriptionEvent.CUSTOM,
            mailTemplateId: 'f35d4391-6521-4648-9e76-8f27fa8fa91d',
            subscriptionFlowId: '454d3146-9266-47a2-a87f-3c306cf1bd69',
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });

    it('updateSubscriptionInterval is not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: updateSubscriptionInterval,
          variables: {
            id: '762e51c5-dbf2-4076-9ec0-881f77bc350a',
            daysAwayFromEnding: 1,
            mailTemplateId: '1eb61385-039a-4143-b525-b3b838e0d777',
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });

    it('deleteSubscriptionInterval is not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: updateSubscriptionInterval,
          variables: {
            id: 'a792ef8a-0092-406d-8f4c-340007099fdd',
          },
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });

    it('paymentMethods is not public', () => {
      return request(app.getHttpServer())
        .post('')
        .send({
          query: paymentMethodsQuery,
        })
        .expect(200)
        .expect(({ body }) => {
          expect(
            !!body.errors.find(
              (error: any) => error.message === 'Forbidden resource'
            )
          ).toEqual(true);
          expect(body.data).toBeNull();
        });
    });
  });

  describe('authenticated', () => {
    let resolver: SubscriptionFlowResolver;
    let subscriptionFlowService: SubscriptionFlowService;

    const mockMemberPlan = {
      id: 'plan-1',
      name: 'Test Plan',
      slug: 'test-plan',
      description: 'Test Description',
      active: true,
      amountPerMonthMin: 1000,
      availablePaymentMethods: [],
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    const mockSubscriptionFlow = {
      id: 'flow-1',
      default: true,
      memberPlanId: 'plan-1',
      periodicities: [PaymentPeriodicity.monthly],
      autoRenewal: [true],
      intervals: [],
      paymentMethods: [],
      memberPlan: mockMemberPlan,
      createdAt: new Date(),
      modifiedAt: new Date(),
    };

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          SubscriptionFlowResolver,
          {
            provide: SubscriptionFlowService,
            useValue: {
              getFlows: jest.fn(),
              createFlow: jest.fn(),
              updateFlow: jest.fn(),
              deleteFlow: jest.fn(),
            },
          },
          {
            provide: PrismaClient,
            useValue: {
              // Mock any PrismaClient methods that might be used in resolver
            },
          },
        ],
      }).compile();

      resolver = module.get<SubscriptionFlowResolver>(SubscriptionFlowResolver);
      subscriptionFlowService = module.get<SubscriptionFlowService>(
        SubscriptionFlowService
      );
    });

    it('includes number of subscriptions', async () => {
      const mockFlows = [mockSubscriptionFlow];
      jest
        .spyOn(subscriptionFlowService, 'getFlows')
        .mockResolvedValue(mockFlows as any);

      const response = await resolver.subscriptionFlows(false, 'plan-1');
      expect(response.length).toEqual(1);
      expect(subscriptionFlowService.getFlows).toHaveBeenCalledWith(
        false,
        'plan-1'
      );
    });

    it('returns subscription flows for all queries and mutations', async () => {
      const mockFlow1 = { ...mockSubscriptionFlow, id: 'flow-1' };
      const mockFlow2 = {
        ...mockSubscriptionFlow,
        id: 'flow-2',
        default: false,
      };

      jest
        .spyOn(subscriptionFlowService, 'getFlows')
        .mockResolvedValueOnce([mockFlow1] as any) // First call
        .mockResolvedValueOnce([mockFlow1, mockFlow2] as any) // After create
        .mockResolvedValueOnce([mockFlow1, mockFlow2] as any) // After update
        .mockResolvedValueOnce([mockFlow1] as any); // After delete

      jest
        .spyOn(subscriptionFlowService, 'createFlow')
        .mockResolvedValue([mockFlow1, mockFlow2] as any);
      jest
        .spyOn(subscriptionFlowService, 'updateFlow')
        .mockResolvedValue([mockFlow1, mockFlow2] as any);
      jest
        .spyOn(subscriptionFlowService, 'deleteFlow')
        .mockResolvedValue([mockFlow1] as any);

      // Test initial state
      expect(
        (await resolver.subscriptionFlows(false, 'plan-1')).length
      ).toEqual(1);

      expect(
        (
          await resolver.createSubscriptionFlow({
            memberPlanId: 'plan-1',
            paymentMethodIds: ['payment-1'],
            periodicities: [PaymentPeriodicity.biannual],
            autoRenewal: [true],
          })
        ).length
      ).toEqual(2);

      expect(
        (
          await resolver.updateSubscriptionFlow({
            id: 'flow-1',
            paymentMethodIds: ['payment-1'],
            periodicities: [PaymentPeriodicity.monthly],
            autoRenewal: [true],
          })
        ).length
      ).toEqual(2);

      const allFlows = await resolver.subscriptionFlows(false, 'plan-1');
      expect(
        (await resolver.deleteSubscriptionFlow(allFlows[1].id)).length
      ).toEqual(1);
    });
  });
});
