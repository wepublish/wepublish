import { Meta } from '@storybook/nextjs-vite';
import {
  mockChallenge,
  mockGiftCodeOffer,
  mockMemberPlan,
  mockSubscribeBlock,
  mockSubscription,
} from '@wepublish/storybook/mocks';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { SubscribeBlock } from './subscribe-block';
import {
  WithRouterDecorator,
  WithSubscribeBlockDecorators,
  WithUserDecorator,
} from '@wepublish/storybook';
import { expect, fn, userEvent, within } from 'storybook/test';

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
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    expect(
      within(canvasElement).queryByRole('group', {
        name: 'Abonnieren oder verschenken',
      })
    ).toBeNull();
  },
};

export const Upgrade = {
  args: subscribeBlock,
  decorators: [
    WithSubscribeBlockDecorators({
      upgradeInfoResult: {
        data: {
          upgradeUserSubscriptionInfo: {
            discountAmount: 50,
            discountPercent: null,
            discountCodeValid: null,
          },
        },
      },
      userSubscriptions: {
        data: {
          userSubscriptions: [
            mockSubscription({
              id: 'subcriptionToUpgrade',
              monthlyAmount: 100,
              memberPlan: mockMemberPlan({
                periodicityPricing: [
                  {
                    __typename: 'PeriodicityPrice',
                    periodicity: PaymentPeriodicity.Monthly,
                    label: null,
                    amountMin: 100,
                    amountTarget: null,
                    amountMax: null,
                  },
                ],
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

const giftCodeOffer = mockGiftCodeOffer({ id: 'gift-offer' });

const subscribeBlockWithGiftCodes = mockSubscribeBlock({
  giftCodeOffers: [giftCodeOffer],
});

const replaceQuery = fn();

export const WithGiftCodeOffers = {
  args: subscribeBlockWithGiftCodes,
  decorators: [WithRouterDecorator({ query: {}, replaceQuery })],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByRole('group', { name: 'Abonnieren oder verschenken' })
    ).toBeTruthy();
    expect(
      canvas.queryByLabelText('Name der beschenkten Person', {
        selector: 'input',
        exact: false,
      })
    ).toBeNull();

    await userEvent.click(canvas.getByRole('button', { name: 'Verschenken' }));

    expect(replaceQuery).toHaveBeenCalledWith({ mode: 'gift' });
  },
};

const purchaseGiftCode = fn(async () => ({ data: undefined }));

export const GiftMode = {
  args: subscribeBlockWithGiftCodes,
  decorators: [
    WithUserDecorator({} as any),
    WithSubscribeBlockDecorators({
      purchaseGiftCode,
      challenge: {
        data: undefined,
        loading: false,
      },
    }),
    WithRouterDecorator({ query: { mode: 'gift' } }),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText('Name der beschenkten Person', {
        selector: 'input',
        exact: false,
      }),
      'Anna Muster'
    );
    await userEvent.click(canvas.getByRole('button', { name: /kaufen/i }));

    expect(purchaseGiftCode).toHaveBeenCalledWith({
      variables: {
        offerId: giftCodeOffer.id,
        recipientName: 'Anna Muster',
        message: null,
        paymentMethodId: giftCodeOffer.paymentMethods[0].id,
      },
    });
  },
};

export const GiftModePaymentFailed = {
  args: subscribeBlockWithGiftCodes,
  decorators: [
    WithUserDecorator({} as any),
    WithSubscribeBlockDecorators({
      challenge: {
        data: undefined,
        loading: false,
      },
    }),
    WithRouterDecorator({
      query: { mode: 'gift', giftCodePurchase: 'failure' },
    }),
  ],
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByText('Die Zahlung konnte nicht abgeschlossen werden.', {
        exact: false,
      })
    ).toBeTruthy();
  },
};
