import { ApolloError } from '@apollo/client';
import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { userEvent, within } from '@storybook/test';
import {
  mockAvailablePaymentMethod,
  mockChallenge,
  mockInvoice,
  mockMemberPlan,
  mockSubscription,
} from '@wepublish/storybook/mocks';
import { WithUserDecorator } from '@wepublish/storybook';
import { wait } from '@wepublish/testing';
import {
  Currency,
  FullMemberPlanFragment,
  PaymentMethod,
  PaymentPeriodicity,
  ProductType,
  SubscriptionDeactivationReason,
} from '@wepublish/website/api';
import { z } from 'zod';
import { Subscribe } from './subscribe';

export default {
  component: Subscribe,
  title: 'Components/Subscribe',
} as Meta<typeof Subscribe>;

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

const memberPlan4 = mockMemberPlan({
  ...memberPlan,
  id: undefined,
  name: 'Donation',
  shortDescription: undefined,
  amountPerMonthMin: 0,
  availablePaymentMethods: [memberPlan.availablePaymentMethods[2]],
  productType: ProductType.Donation,
});

const challenge = mockChallenge();

const subscription = mockSubscription({
  memberPlan,
  monthlyAmount: memberPlan.amountPerMonthMin,
  paymentPeriodicity: PaymentPeriodicity.Yearly,
  canExtend: true,
});

const invoice = mockInvoice({
  total: 5000,
  subscription,
});

const fillFirstName: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Vorname', {
    selector: 'input',
  });

  await step('Enter firstname', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Foo');
  });
};

const fillName: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Nachname', {
    selector: 'input',
  });

  await step('Enter name', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Bar');
  });
};

const fillEmail: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Email', {
    selector: 'input',
  });

  await step('Enter email', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'foobar@email.com');
  });
};

const fillPassword: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Passwort', {
    selector: 'input',
  });

  const repeatInput = canvas.getByLabelText('Passwort wiederholen', {
    selector: 'input',
  });

  await step('Enter password', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '12345678');

    await userEvent.click(repeatInput);
    await userEvent.type(repeatInput, '12345678');
  });
};

const fillStreetName: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const streetInput = canvas.getByLabelText('Strasse', {
    selector: 'input',
  });

  const numberInput = canvas.getByLabelText('Hausnummer', {
    selector: 'input',
  });

  await step('Enter streetName', async () => {
    await userEvent.click(streetInput);
    await userEvent.type(streetInput, 'Musterstrasse');

    await userEvent.click(numberInput);
    await userEvent.type(numberInput, '1');
  });
};

const fillZip: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('PLZ', {
    selector: 'input',
  });

  await step('Enter zip', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '8047');
  });
};

const fillCity: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Ort / Stadt', {
    selector: 'input',
  });

  await step('Enter city', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Zürich');
  });
};

const fillCountry: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Land', {
    selector: 'input',
  });

  await step('Enter country', async () => {
    await userEvent.click(input);
    await userEvent.type(input, 'Schweiz{enter}');
  });
};

const fillCaptcha: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Captcha', {
    selector: 'input',
  });

  await step('Enter captcha', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '1');
  });
};

const clickPayTransactionFees: StoryObj['play'] = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement);
  const transactionFees = canvas.getByText('Bearbeitungsgebühren', {
    exact: false,
  });

  await step('Pay transaction fees', async () => {
    await userEvent.click(transactionFees);
  });
};

const clickSubscribe: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByText('Abonnieren', {
    exact: false,
  });

  await step('Submit form', async () => {
    await userEvent.click(submitButton);
  });
};

const fillRequired: StoryObj['play'] = async ctx => {
  const { step } = ctx;

  await step('Enter required credentials', async () => {
    await fillName(ctx);
    await fillEmail(ctx);
    await fillCaptcha(ctx);
  });
};

const fillBirthday: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Geburtstag', {
    selector: 'input',
  });

  await step('Enter birthday', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '09081994');
  });
};

const fillAddress: StoryObj['play'] = async ctx => {
  const { step } = ctx;

  await step('Enter address', async () => {
    await fillStreetName(ctx);
    await fillZip(ctx);
    await fillCity(ctx);
    await fillCountry(ctx);
  });
};

const changeMemberPlan =
  (plan: FullMemberPlanFragment): NonNullable<StoryObj['play']> =>
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByLabelText(plan.name, {
      selector: 'input',
      exact: false,
    });

    await step('Change MemberPlan', async () => {
      await userEvent.click(input);
      await wait(10); // wait for reset to happen
    });
  };

const changePaymentMethod =
  (paymentMethod: PaymentMethod): NonNullable<StoryObj['play']> =>
  async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const input = canvas.getByLabelText(
      `${paymentMethod.description} ${paymentMethod.name}`
    );

    await step('Change Paymentmethod', async () => {
      await userEvent.click(input);
      await wait(10); // wait for reset to happen
    });
  };

const waitForInitialDataIsSet =
  (
    playFunction: NonNullable<StoryObj['play']>
  ): NonNullable<StoryObj['play']> =>
  async ctx => {
    await wait(100);
    await playFunction(ctx);
  };

export const LoggedOut: StoryObj<typeof Subscribe> = {
  args: {
    memberPlans: {
      data: {
        memberPlans: {
          nodes: [memberPlan, memberPlan2, memberPlan3, memberPlan4],
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            __typename: 'PageInfo',
          },
          totalCount: 3,
        },
      },
      loading: false,
    },
    challenge: {
      data: {
        challenge,
      },
      loading: false,
    },
    userSubscriptions: {
      data: undefined,
      loading: false,
    },
    userInvoices: {
      data: undefined,
      loading: false,
    },
    onSubscribeWithRegister: async (...data) =>
      action('onSubscribeWithRegister')(...data),
    onSubscribe: async (...data) => action('onSubscribe')(...data),
  },
};

export const LoggedIn: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    challenge: {
      data: undefined,
      loading: false,
    },
    userSubscriptions: {
      data: {
        userSubscriptions: [subscription],
      },
      loading: false,
    },
    userInvoices: {
      data: {
        userInvoices: [invoice],
      },
      loading: false,
    },
  },
  decorators: [WithUserDecorator({} as any)],
};

export const Filled: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  play: waitForInitialDataIsSet(async ctx => {
    await fillRequired(ctx);
    await fillFirstName(ctx);
    await fillPassword(ctx);
    await fillAddress(ctx);
    await clickPayTransactionFees(ctx);
    await clickSubscribe(ctx);
  }),
};

export const Invalid: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  play: waitForInitialDataIsSet(async ctx => {
    await clickSubscribe(ctx);
  }),
};

export const OnlyFirstName: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    fields: ['firstName'],
  },
};

export const OnlyFirstNameFilled: StoryObj<typeof Subscribe> = {
  ...OnlyFirstName,
  play: waitForInitialDataIsSet(async ctx => {
    await fillRequired(ctx);
    await fillFirstName(ctx);
    await clickSubscribe(ctx);
  }),
};

export const OnlyFirstNameInvalid: StoryObj<typeof Subscribe> = {
  ...OnlyFirstName,
  play: waitForInitialDataIsSet(async ctx => {
    await clickSubscribe(ctx);
  }),
};

export const OnlyBirthday: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    fields: ['birthday'],
  },
};

export const OnlyBirthdayFilled: StoryObj<typeof Subscribe> = {
  ...OnlyBirthday,
  play: async ctx => {
    await fillRequired(ctx);
    await fillBirthday(ctx);
    await clickSubscribe(ctx);
  },
};

export const OnlyBirthdayInvalid: StoryObj<typeof Subscribe> = {
  ...OnlyBirthday,
  play: async ctx => {
    await clickSubscribe(ctx);
  },
};

export const OnlyAddress: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    fields: ['address'],
  },
};

export const OnlyAddressFilled: StoryObj<typeof Subscribe> = {
  ...OnlyAddress,
  play: waitForInitialDataIsSet(async ctx => {
    await fillRequired(ctx);
    await fillAddress(ctx);
    await clickSubscribe(ctx);
  }),
};

export const OnlyAddressInvalid: StoryObj<typeof Subscribe> = {
  ...OnlyAddress,
  play: waitForInitialDataIsSet(async ctx => {
    await clickSubscribe(ctx);
  }),
};

export const OnlyPassword: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    fields: ['password', 'passwordRepeated'],
  },
};

export const OnlyPasswordFilled: StoryObj<typeof Subscribe> = {
  ...OnlyPassword,
  play: waitForInitialDataIsSet(async ctx => {
    await fillRequired(ctx);
    await fillPassword(ctx);
    await clickSubscribe(ctx);
  }),
};

export const OnlyPasswordInvalid: StoryObj<typeof Subscribe> = {
  ...OnlyPassword,
  play: waitForInitialDataIsSet(async ctx => {
    await clickSubscribe(ctx);
  }),
};

export const OnlyRequired: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    fields: [],
  },
};

export const OnlyRequiredFilled: StoryObj<typeof Subscribe> = {
  ...OnlyRequired,
  play: waitForInitialDataIsSet(async ctx => {
    await fillRequired(ctx);
    await clickSubscribe(ctx);
  }),
};

export const LoggedInFilled: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  play: waitForInitialDataIsSet(async ctx => {
    await clickSubscribe(ctx);
  }),
};

export const OnlyRequiredInvalid: StoryObj<typeof Subscribe> = {
  ...OnlyRequired,
  play: waitForInitialDataIsSet(async ctx => {
    await clickSubscribe(ctx);
  }),
};

const customSchema = z.object({
  password: z.string().min(16),
});

export const WithCustomValidation: StoryObj<typeof Subscribe> = {
  ...OnlyPasswordInvalid,
  args: {
    ...OnlyPasswordInvalid.args,
    schema: customSchema,
  },
};

export const WithChallengeError: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    challenge: {
      error: new ApolloError({ errorMessage: 'Something went wrong.' }),
      data: undefined,
      loading: false,
    },
  },
};

export const WithChallengeLoading: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    challenge: {
      loading: true,
      data: undefined,
    },
  },
};

export const WithUserSubscriptionsLoading: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    userSubscriptions: {
      loading: true,
      data: undefined,
    },
  },
};

export const WithUserInvoicesLoading: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    userInvoices: {
      loading: true,
      data: undefined,
    },
  },
};

export const WithRegisterError: StoryObj<typeof Subscribe> = {
  ...LoggedOut,
  args: {
    ...LoggedOut.args,
    onSubscribeWithRegister: (...args: unknown[]) => {
      action('onSubscribeWithRegister')(args);

      throw new ApolloError({
        errorMessage: 'Email already in use.',
      });
    },
  },
  play: Filled.play,
};

export const WithSubscribeError: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    onSubscribe: (...args: unknown[]) => {
      action('onSubscribe')(args);

      throw new ApolloError({
        errorMessage: 'Something went wrong.',
      });
    },
  },
  play: waitForInitialDataIsSet(async ctx => {
    await clickSubscribe(ctx);
  }),
};

export const ResetPaymentOptionsOnMemberPlanChange: StoryObj<typeof Subscribe> =
  {
    ...LoggedIn,
    play: waitForInitialDataIsSet(async ctx => {
      await changeMemberPlan(memberPlan3)(ctx);
      await clickSubscribe(ctx);
    }),
  };

export const ResetPaymentOptionsOnPaymentMethodChange: StoryObj<
  typeof Subscribe
> = {
  ...LoggedIn,
  play: waitForInitialDataIsSet(async ctx => {
    await changePaymentMethod(
      memberPlan.availablePaymentMethods[2].paymentMethods[0]
    )(ctx);
    await clickSubscribe(ctx);
  }),
};

export const NoWarningDeactivatedSubscription: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    userSubscriptions: {
      data: {
        subscriptions: [
          {
            ...subscription,
            deactivation: {
              date: new Date('2023-01-01').toISOString(),
              reason: SubscriptionDeactivationReason.None,
            },
          },
        ],
      },
      loading: false,
    },
  },
};

export const NoWarningPaidInvoice: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  args: {
    ...LoggedIn.args,
    userInvoices: {
      data: {
        userInvoices: [
          { ...invoice, paidAt: new Date('2023-01-01').toISOString() },
          { ...invoice, canceledAt: new Date('2023-01-01').toISOString() },
        ],
      },
      loading: false,
    },
  },
};

export const WithCurrency: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  play: waitForInitialDataIsSet(async ctx => {
    await changeMemberPlan(memberPlan2)(ctx);
  }),
};

export const WithDonate: StoryObj<typeof Subscribe> = {
  ...LoggedIn,
  play: waitForInitialDataIsSet(async ctx => {
    await changeMemberPlan(memberPlan4)(ctx);
  }),
};
