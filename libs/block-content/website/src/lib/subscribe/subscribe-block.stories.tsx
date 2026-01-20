import { Meta } from '@storybook/react';
import {
  mockChallenge,
  mockMemberPlan,
  mockSubscribeBlock,
  mockSubscription,
} from '@wepublish/storybook/mocks';
import { SubscribeBlock } from './subscribe-block';
import {
  WithRouterDecorator,
  WithSubscribeBlockDecorators,
} from '@wepublish/storybook';

export default {
  component: SubscribeBlock,
  title: 'Blocks/Subscribe',
  decorators: [
    WithSubscribeBlockDecorators({
      challenge: {
        data: {
          challenge: mockChallenge(),
        },
        loading: false,
      },
    }),
  ],
} as Meta;

const subscribeBlock = mockSubscribeBlock();

export const Default = {
  args: subscribeBlock,
};

export const Upgrade = {
  args: subscribeBlock,
  decorators: [
    WithSubscribeBlockDecorators({
      upgradeInfoResult: {
        data: {
          upgradeSubscriptionInfo: {
            discountAmount: 50,
          },
        },
      },
      userSubscriptions: {
        data: {
          subscriptions: [
            mockSubscription({
              id: 'subcriptionToUpgrade',
              monthlyAmount: 100,
              memberPlan: mockMemberPlan({
                amountPerMonthMin: 100,
              }),
            }),
          ],
        },
        loading: false,
      },
    }),
    WithRouterDecorator({
      query: {
        upgradeSubscriptionId: 'subcriptionToUpgrade',
      },
    }),
  ],
};
