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
