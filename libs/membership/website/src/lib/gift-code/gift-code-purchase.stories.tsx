import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { WithUserDecorator } from '@wepublish/storybook';
import { mockChallenge, mockGiftCodeOffer } from '@wepublish/storybook/mocks';
import { PaymentPeriodicity } from '@wepublish/website/api';
import { expect, fn, userEvent, within } from 'storybook/test';
import { GiftCodePurchase } from './gift-code-purchase';

export default {
  component: GiftCodePurchase,
  title: 'Components/GiftCodePurchase',
} as Meta<typeof GiftCodePurchase>;

const yearlyOffer = mockGiftCodeOffer({
  id: 'offer-yearly',
  name: 'Jahresabo verschenken',
});

const monthlyOffer = mockGiftCodeOffer({
  id: 'offer-monthly',
  name: 'Monatsabo verschenken',
  periodicity: PaymentPeriodicity.Quarterly,
  redemptionWindowMonths: null,
  price: {
    __typename: 'GiftCodePrice',
    amount: 3000,
    currency: yearlyOffer.price.currency,
  },
});

const fillRecipient: NonNullable<StoryObj['play']> = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement);

  await step('Enter recipient', async () => {
    await userEvent.type(
      canvas.getByLabelText('Name der beschenkten Person', {
        selector: 'input',
        exact: false,
      }),
      'Anna Muster'
    );
    await userEvent.type(
      canvas.getByLabelText('Persönliche Nachricht (optional)', {
        selector: 'textarea',
      }),
      'Alles Gute!'
    );
  });
};

const clickPurchase: NonNullable<StoryObj['play']> = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement);

  await step('Submit form', async () => {
    await userEvent.click(canvas.getByRole('button', { name: /kaufen/i }));
  });
};

export const LoggedOut: StoryObj<typeof GiftCodePurchase> = {
  args: {
    offers: [yearlyOffer, monthlyOffer],
    challenge: {
      data: {
        challenge: mockChallenge(),
      },
      loading: false,
    },
    onPurchase: fn(),
    onPurchaseWithRegister: fn(),
  },
};

export const LoggedIn: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    challenge: {
      data: undefined,
      loading: false,
    },
  },
  decorators: [WithUserDecorator({} as any)],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByText(
        'Den Gutscheincode erhältst du, sobald die Zahlung bestätigt ist. Bei Zahlung per Rechnung kann das einige Tage dauern.'
      )
    ).toBeTruthy();
    expect(canvas.queryByLabelText('Email', { selector: 'input' })).toBeNull();
    expect(
      canvas.getByRole('button', { name: 'Gutschein für CHF 120.- kaufen' })
    ).toBeTruthy();
  },
};

export const LoggedInFilled: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    onPurchase: fn(),
  },
  play: async ctx => {
    const canvas = within(ctx.canvasElement);

    await ctx.step('Choose the second offer', async () => {
      await userEvent.click(
        canvas.getByLabelText(monthlyOffer.name, { exact: false })
      );
    });

    await fillRecipient(ctx);
    await clickPurchase(ctx);

    await ctx.step('Purchases the chosen offer', async () => {
      expect(ctx.args.onPurchase).toHaveBeenCalledWith({
        offerId: monthlyOffer.id,
        recipientName: 'Anna Muster',
        message: 'Alles Gute!',
        paymentMethodId: monthlyOffer.paymentMethods[0].id,
      });
    });
  },
};

export const Invalid: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    onPurchase: fn(),
  },
  play: async ctx => {
    await clickPurchase(ctx);

    await ctx.step('Does not purchase without a recipient', async () => {
      expect(ctx.args.onPurchase).not.toHaveBeenCalled();
      expect(
        within(ctx.canvasElement)
          .getByLabelText('Name der beschenkten Person', {
            selector: 'input',
            exact: false,
          })
          .getAttribute('aria-invalid')
      ).toBe('true');
    });
  },
};

export const SingleOffer: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    offers: [yearlyOffer],
  },
  play: async ({ canvasElement }) => {
    expect(within(canvasElement).queryByText('Geschenk wählen')).toBeNull();
    expect(
      within(canvasElement).getByRole('radiogroup', {
        name: 'Geschenk wählen',
      })
    ).toBeTruthy();
  },
};

export const IssueBeforePayment: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    offers: [{ ...yearlyOffer, issueBeforePayment: true }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByText(
        'Den Gutscheincode findest du direkt nach dem Kauf unter «Meine Gutscheine» in deinem Profil.'
      )
    ).toBeTruthy();
    expect(
      canvas.queryByText(
        'Den Gutscheincode erhältst du, sobald die Zahlung bestätigt ist. Bei Zahlung per Rechnung kann das einige Tage dauern.'
      )
    ).toBeNull();
  },
};

export const NoPaymentMethods: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    offers: [{ ...yearlyOffer, paymentMethods: [] }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(
      canvas.getByText(
        'Für dieses Geschenk ist zurzeit keine Zahlungsmethode verfügbar.'
      )
    ).toBeTruthy();
    expect(
      (
        canvas.getByRole('button', {
          name: /kaufen/i,
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);
  },
};

const discountOffer = { ...yearlyOffer, allowDiscountCodes: true };

const subscribeInfo = (
  createSubscriptionInfo: {
    discountPercent?: number | null;
    discountCodeValid?: boolean | null;
  } = {}
) => ({
  data: {
    __typename: 'Query' as const,
    createSubscriptionInfo: {
      __typename: 'CreateSubscriptionInfo' as const,
      discountPercent: null,
      discountCodeValid: null,
      ...createSubscriptionInfo,
    },
  },
  loading: false,
});

const enterDiscountCode =
  (code: string): NonNullable<StoryObj['play']> =>
  async ({ canvasElement, step }) => {
    await step('Enter discount code', async () => {
      await userEvent.type(
        within(canvasElement).getByLabelText('Rabattcode', {
          selector: 'input',
        }),
        code
      );
    });
  };

export const WithoutDiscountCodes: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    offers: [yearlyOffer],
    fetchSubscribeInfo: fn(),
    subscribeInfo: subscribeInfo(),
  },
  play: async ({ canvasElement }) => {
    expect(
      within(canvasElement).queryByLabelText('Rabattcode', {
        selector: 'input',
      })
    ).toBeNull();
  },
};

export const WithDiscountCode: StoryObj<typeof GiftCodePurchase> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    offers: [discountOffer],
    onPurchase: fn(),
    fetchSubscribeInfo: fn(),
    subscribeInfo: subscribeInfo({
      discountPercent: 0.2,
      discountCodeValid: true,
    }),
  },
  play: async ctx => {
    const canvas = within(ctx.canvasElement);

    await fillRecipient(ctx);
    await enterDiscountCode('SOMMER')(ctx);

    await ctx.step('Checks the code against the gifted plan', async () => {
      expect(ctx.args.fetchSubscribeInfo).toHaveBeenLastCalledWith({
        variables: {
          memberPlanId: discountOffer.memberPlan.id,
          discountCode: 'SOMMER',
        },
      });
    });

    await ctx.step('Shows the reduced price', async () => {
      expect(canvas.getByText('20% Rabatt angewendet')).toBeTruthy();
      expect(
        canvas.getByRole('button', { name: 'Gutschein für CHF 96.- kaufen' })
      ).toBeTruthy();
    });

    await clickPurchase(ctx);

    await ctx.step('Purchases with the code', async () => {
      expect(ctx.args.onPurchase).toHaveBeenCalledWith({
        offerId: discountOffer.id,
        recipientName: 'Anna Muster',
        message: 'Alles Gute!',
        paymentMethodId: discountOffer.paymentMethods[0].id,
        discountCode: 'SOMMER',
      });
    });
  },
};

export const WithInvalidDiscountCode: StoryObj<typeof GiftCodePurchase> = {
  ...WithDiscountCode,
  args: {
    ...WithDiscountCode.args,
    onPurchase: fn(),
    subscribeInfo: subscribeInfo({ discountCodeValid: false }),
  },
  play: async ctx => {
    const canvas = within(ctx.canvasElement);

    await fillRecipient(ctx);
    await enterDiscountCode('NOPE')(ctx);

    await ctx.step('Blocks the purchase', async () => {
      expect(canvas.getByText('Rabattcode ungültig')).toBeTruthy();
      expect(
        (
          canvas.getByRole('button', {
            name: 'Gutschein für CHF 120.- kaufen',
          }) as HTMLButtonElement
        ).disabled
      ).toBe(true);
      expect(ctx.args.onPurchase).not.toHaveBeenCalled();
    });
  },
};

export const WithFreeDiscountCode: StoryObj<typeof GiftCodePurchase> = {
  ...WithDiscountCode,
  args: {
    ...WithDiscountCode.args,
    onPurchase: fn(),
    subscribeInfo: subscribeInfo({
      discountPercent: 1,
      discountCodeValid: true,
    }),
  },
  play: async ctx => {
    const canvas = within(ctx.canvasElement);

    await fillRecipient(ctx);
    await enterDiscountCode('GRATIS')(ctx);

    await ctx.step('Blocks a free gift', async () => {
      expect(
        canvas.getByText(
          'Mit diesem Rabattcode wäre das Geschenk gratis. Das ist zurzeit nicht möglich.'
        )
      ).toBeTruthy();
      expect(
        (canvas.getByRole('button', { name: /kaufen/i }) as HTMLButtonElement)
          .disabled
      ).toBe(true);
    });
  },
};

export const WithDiscountCodeDefault: StoryObj<typeof GiftCodePurchase> = {
  ...WithDiscountCode,
  args: {
    ...WithDiscountCode.args,
    defaults: { discountCode: 'SOMMER' },
  },
  play: async ({ canvasElement }) => {
    expect(
      (
        within(canvasElement).getByLabelText('Rabattcode', {
          selector: 'input',
        }) as HTMLInputElement
      ).value
    ).toBe('SOMMER');
  },
};
