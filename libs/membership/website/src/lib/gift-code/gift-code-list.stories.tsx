import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockGiftCode, mockPaymentMethod } from '@wepublish/storybook/mocks';
import { GiftCodeStatus } from '@wepublish/website/api';
import { expect, fn, userEvent, within } from 'storybook/test';
import { GiftCodeList } from './gift-code-list';

export default {
  component: GiftCodeList,
  title: 'Components/GiftCodeList',
} as Meta<typeof GiftCodeList>;

const paymentMethod = mockPaymentMethod({
  id: 'pm-card',
  name: 'Kreditkarte',
  paymentProviderID: 'stripe',
});

const orderedCode = mockGiftCode({
  id: 'gift-ordered',
  status: GiftCodeStatus.Ordered,
  offer: {
    __typename: 'GiftCodeOffer',
    id: 'offer-1',
    name: 'Jahresabo verschenken',
    paymentMethods: [paymentMethod],
  },
});

const withCodes = (
  ...giftCodes: ReturnType<typeof mockGiftCode>[]
): StoryObj<typeof GiftCodeList>['args'] => ({
  data: { myGiftCodes: giftCodes },
  loading: false,
  onPay: fn(),
});

export const Ordered: StoryObj<typeof GiftCodeList> = {
  args: withCodes(orderedCode),
  play: async ctx => {
    const canvas = within(ctx.canvasElement);

    expect(canvas.getByText('Bestellt')).toBeTruthy();
    expect(canvas.queryByText('ABCD-EFGH-JKMN')).toBeNull();

    await ctx.step('Pays the order', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Bezahlen' }));
      expect(ctx.args.onPay).toHaveBeenCalledWith(orderedCode.id, 'pm-card');
    });
  },
};

export const Issued: StoryObj<typeof GiftCodeList> = {
  args: withCodes(mockGiftCode({ status: GiftCodeStatus.Issued })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText('ABCD-EFGH-JKMN')).toBeTruthy();
    expect(canvas.getByRole('button', { name: 'Code kopieren' })).toBeTruthy();
    expect(canvas.queryByRole('button', { name: 'Bezahlen' })).toBeNull();
  },
};

export const IssuedUnpaid: StoryObj<typeof GiftCodeList> = {
  args: withCodes(
    mockGiftCode({
      status: GiftCodeStatus.Issued,
      paid: false,
      offer: orderedCode.offer,
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText('ABCD-EFGH-JKMN')).toBeTruthy();
    expect(
      canvas.getByText('Noch nicht bezahlt', { exact: false })
    ).toBeTruthy();
    expect(canvas.getByRole('button', { name: 'Bezahlen' })).toBeTruthy();
  },
};

export const UnpaidWithoutPaymentMethods: StoryObj<typeof GiftCodeList> = {
  args: withCodes(
    mockGiftCode({
      ...orderedCode,
      offer: { ...orderedCode.offer, paymentMethods: [] },
    })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByText(
        'Für dieses Geschenk ist zurzeit keine Zahlungsmethode verfügbar.'
      )
    ).toBeTruthy();
    expect(canvas.queryByRole('button', { name: 'Bezahlen' })).toBeNull();
  },
};

export const Redeemed: StoryObj<typeof GiftCodeList> = {
  args: withCodes(mockGiftCode({ status: GiftCodeStatus.Redeemed })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText('Eingelöst')).toBeTruthy();
    expect(canvas.queryByText('ABCD-EFGH-JKMN')).toBeNull();
  },
};

export const Canceled: StoryObj<typeof GiftCodeList> = {
  args: withCodes(
    mockGiftCode({ status: GiftCodeStatus.Canceled, code: null })
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText('Storniert')).toBeTruthy();
    expect(canvas.queryByRole('button', { name: 'Bezahlen' })).toBeNull();
  },
};

export const Expired: StoryObj<typeof GiftCodeList> = {
  args: withCodes(mockGiftCode({ status: GiftCodeStatus.Expired })),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvas.getByText('Abgelaufen')).toBeTruthy();
    expect(canvas.queryByText('ABCD-EFGH-JKMN')).toBeNull();
  },
};

export const Empty: StoryObj<typeof GiftCodeList> = {
  args: withCodes(),
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).queryByText('Meine Gutscheine')).toBeNull();
  },
};
