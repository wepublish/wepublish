import { StoryObj } from '@storybook/react';
import {
  ChallengeDocument,
  Currency,
  InvoicesDocument,
  MemberPlanListDocument,
  PaymentPeriodicity,
  RegisterDocument,
  SubscribeDocument,
  SubscriptionsDocument,
} from '@wepublish/website/api';
import { SubscribeContainer } from './subscribe-container';
import * as registrationFormStories from './subscribe.stories';
import { ApolloError } from '@apollo/client';
import { waitFor, within } from '@storybook/test';
import { useUser } from '@wepublish/authentication/website';
import {
  mockAvailablePaymentMethod,
  mockChallenge,
  mockInvoice,
  mockMemberPlan,
  mockSubscription,
} from '@wepublish/storybook/mocks';
import { WithUserDecorator } from '@wepublish/storybook';
import { faker } from '@faker-js/faker';

export default {
  title: 'Container/Subscribe',
  component: SubscribeContainer,
};

const memberPlan = mockMemberPlan({
  availablePaymentMethods: [
    mockAvailablePaymentMethod({
      forceAutoRenewal: false,
      paymentPeriodicities: [
        PaymentPeriodicity.Monthly,
        PaymentPeriodicity.Quarterly,
        PaymentPeriodicity.Biannual,
        PaymentPeriodicity.Yearly,
        PaymentPeriodicity.Biennial,
        PaymentPeriodicity.Lifetime,
      ],
    }),
    mockAvailablePaymentMethod({
      forceAutoRenewal: false,
      paymentPeriodicities: [PaymentPeriodicity.Lifetime],
    }),
    mockAvailablePaymentMethod({
      forceAutoRenewal: true,
      paymentPeriodicities: [PaymentPeriodicity.Lifetime],
    }),
  ],
});

const memberPlan2 = mockMemberPlan({
  ...memberPlan,
  id: undefined,
  name: undefined,
  shortDescription: undefined,
  amountPerMonthMin: 800,
  amountPerMonthTarget: 800,
  availablePaymentMethods: [memberPlan.availablePaymentMethods[1]],
  currency: Currency.Eur,
});

const memberPlan3 = mockMemberPlan({
  ...memberPlan,
  id: undefined,
  name: undefined,
  shortDescription: undefined,
  amountPerMonthMin: 1200,
  amountPerMonthTarget: 1200,
  availablePaymentMethods: [memberPlan.availablePaymentMethods[2]],
});

const challenge = mockChallenge();

const subscription = mockSubscription({
  memberPlan,
  monthlyAmount: memberPlan.amountPerMonthMin,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
  deactivation: null,
  extendable: true,
  externalReward: 'https://example.com/external-reward-mock-url',
});

const invoice = mockInvoice({
  total: 5000,
  subscription,
  canceledAt: null,
  description: 'Mock Invoice',
});

const registerVariables = {
  firstName: faker.person.firstName(),
  name: faker.person.lastName(),
  email: faker.internet.email(),
  challengeAnswer: {
    challengeSolution: '1',
    challengeID: challenge.challengeID,
  },
  address: {
    streetAddress: 'Musterstrasse 1',
    zipCode: '8047',
    city: 'Zürich',
    country: 'Schweiz',
  },
  password: '12345678',
};

export const Default: StoryObj<typeof SubscribeContainer> = {
  args: {},
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: MemberPlanListDocument,
            variables: {
              take: 50,
              filter: {
                active: true,
              },
            },
          },
          result: {
            data: {
              memberPlans: {
                nodes: [memberPlan, memberPlan2, memberPlan3],
                pageInfo: {
                  startCursor: null,
                  endCursor: null,
                  hasNextPage: false,
                  hasPreviousPage: false,
                  __typename: 'PageInfo',
                },
                totalCount: 3,
              },
            },
          },
        },
        {
          request: {
            query: ChallengeDocument,
          },
          result: {
            data: { challenge },
          },
        },
        {
          request: {
            query: SubscriptionsDocument,
          },
          result: {
            data: { userSubscriptions: [subscription] },
          },
        },
        {
          request: {
            query: InvoicesDocument,
          },
          result: {
            data: { invoices: [invoice] },
          },
        },
        {
          request: {
            query: RegisterDocument,
            variables: registerVariables,
          },
          result: {
            data: {
              registerMember: {
                session: {
                  createdAt: new Date('2023-01-01'),
                  expiresAt: new Date('2023-01-01'),
                  token: '1234-1234',
                },
                user: {
                  id: '1234-1234',
                  firstName: 'Foo',
                  name: 'Bar',
                  email: 'foobar@example.com',
                  paymentProviderCustomers: [],
                  properties: [],
                },
              },
            },
          },
        },
        {
          request: {
            query: SubscribeDocument,
            variables: {
              monthlyAmount: 500,
              memberPlanId: '123',
              paymentMethodId: '12345',
              paymentPeriodicity: 'MONTHLY',
              autoRenew: true,
            },
          },
          result: {
            data: {
              createSubscription: {
                intentSecret: '',
              },
            },
          },
        },
      ],
    },
  },
};

export const LoggedIn: StoryObj<typeof SubscribeContainer> = {
  ...Default,
  decorators: [WithUserDecorator(null)],
};

export const Filled: StoryObj<typeof SubscribeContainer> = {
  ...Default,
  parameters: {
    ...Default.parameters,
  },
  render: function Render(args) {
    const { user } = useUser();

    return (
      <>
        {user && <div>Logged in as {user?.firstName}</div>}
        <SubscribeContainer {...args} />
      </>
    );
  },
  play: async ctx => {
    const canvas = within(ctx.canvasElement);
    await waitFor(() => canvas.getByLabelText('Captcha'));

    // false positive due to the `as any`
    // eslint-disable-next-line storybook/context-in-play-function
    await registrationFormStories.Filled.play?.(ctx as any);
  },
};

export const WithFilter: StoryObj<typeof SubscribeContainer> = {
  ...Default,
  args: {
    ...Default.args,
    filter: memberPlans => memberPlans.filter(mb => mb.id === memberPlan2.id),
  },
};

export const WithChallengeError: StoryObj<typeof SubscribeContainer> = {
  args: {},
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: MemberPlanListDocument,
            variables: {
              take: 50,
              filter: {
                active: true,
              },
            },
          },
          result: {
            data: {
              memberPlans: {
                nodes: [memberPlan, memberPlan2, memberPlan3],
                pageInfo: {
                  startCursor: null,
                  endCursor: null,
                  hasNextPage: false,
                  hasPreviousPage: false,
                  __typename: 'PageInfo',
                },
                totalCount: 3,
              },
            },
          },
        },
        {
          request: {
            query: ChallengeDocument,
          },
          result: {
            errors: [
              new ApolloError({ errorMessage: 'Something went wrong.' }),
            ],
          },
        },
      ],
    },
  },
};
