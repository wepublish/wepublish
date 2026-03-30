import { action } from '@storybook/addon-actions';
import { Meta, StoryObj } from '@storybook/react';
import { RegistrationForm } from './registration-form';
import { ApolloError } from '@apollo/client';
import { CaptchaType, Challenge } from '@wepublish/website/api';
import { userEvent, within } from '@storybook/test';
import { ComponentProps } from 'react';
import { useArgs } from '@storybook/preview-api';
import z from 'zod';

const Render = () => {
  const [args, updateArgs] = useArgs();
  const props = args as ComponentProps<typeof RegistrationForm>;

  return (
    <RegistrationForm
      {...props}
      onRegister={data => {
        args.onRegister(data);
        updateArgs({
          register: {
            loading: true,
          },
        });
      }}
    />
  );
};

export default {
  title: 'Components/Registration Form',
  component: RegistrationForm,
  render: Render,
} as Meta;

const challenge = {
  challengeID: '1x00000000000000000000AA',
  challenge: null,
  validUntil: null,
  type: CaptchaType.CfTurnstile,
  __typename: 'Challenge',
} as Challenge;

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

const fillPassword: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Passwort', {
    selector: 'input',
  });

  await step('Enter password', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '12345678');
  });
};

const fillRepeatPassword: StoryObj['play'] = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement);

  const input = canvas.getByLabelText('Passwort wiederholen', {
    selector: 'input',
  });

  await step('Enter password', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '12345678');
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

const clickRegister: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByText('Registrieren');

  await step('Submit form', async () => {
    await userEvent.click(submitButton);
  });
};

const fillRequired: StoryObj['play'] = async ctx => {
  const { step } = ctx;

  await step('Enter required credentials', async () => {
    await fillName(ctx);
    await fillEmail(ctx);
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

export const Default: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: { challenge },
    },
    register: {},
  },
};

export const Filled: StoryObj = {
  ...Default,
  play: async ctx => {
    await fillRequired(ctx);
    await fillFirstName(ctx);
    await fillPassword(ctx);
    await fillRepeatPassword(ctx);
    await fillAddress(ctx);
    await clickRegister(ctx);
  },
};

export const Invalid: StoryObj = {
  ...Default,
  play: async ctx => {
    await clickRegister(ctx);
  },
};

export const OnlyFirstName: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    fields: ['firstName'],
  },
};

export const OnlyFirstNameFilled: StoryObj = {
  ...OnlyFirstName,
  play: async ctx => {
    await fillRequired(ctx);
    await fillFirstName(ctx);
    await clickRegister(ctx);
  },
};

export const OnlyFirstNameInvalid: StoryObj = {
  ...OnlyFirstName,
  play: async ctx => {
    await clickRegister(ctx);
  },
};

export const OnlyBirthday: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    fields: ['birthday'],
  },
};

export const OnlyBirthdayFilled: StoryObj = {
  ...OnlyBirthday,
  play: async ctx => {
    await fillRequired(ctx);
    await fillBirthday(ctx);
    await clickRegister(ctx);
  },
};

export const OnlyBirthdayInvalid: StoryObj = {
  ...OnlyBirthday,
  play: async ctx => {
    await clickRegister(ctx);
  },
};

export const OnlyAddress: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    fields: ['address'],
  },
};

export const OnlyAddressFilled: StoryObj = {
  ...OnlyAddress,
  play: async ctx => {
    await fillRequired(ctx);
    await fillAddress(ctx);
    await clickRegister(ctx);
  },
};

export const OnlyAddressInvalid: StoryObj = {
  ...OnlyAddress,
  play: async ctx => {
    await clickRegister(ctx);
  },
};

export const OnlyPassword: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    fields: ['password'],
  },
};

export const OnlyPasswordFilled: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await fillRequired(ctx);
    await fillPassword(ctx);
    await clickRegister(ctx);
  },
};

export const OnlyPasswordInvalid: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await clickRegister(ctx);
  },
};

export const OnlyPasswordWithRepeat: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    fields: ['password', 'passwordRepeated'],
  },
};

export const OnlyPasswordWithRepeatFilled: StoryObj = {
  ...OnlyPasswordWithRepeat,
  play: async ctx => {
    await fillRequired(ctx);
    await fillPassword(ctx);
    await fillRepeatPassword(ctx);
    await clickRegister(ctx);
  },
};

export const OnlyPasswordWithRepeatInvalid: StoryObj = {
  ...OnlyPasswordWithRepeat,
  play: async ctx => {
    await clickRegister(ctx);
  },
};

export const OnlyRequired: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    fields: [],
  },
};

export const OnlyRequiredFilled: StoryObj = {
  ...OnlyRequired,
  play: async ctx => {
    await fillRequired(ctx);
    await clickRegister(ctx);
  },
};

export const OnlyRequiredInvalid: StoryObj = {
  ...OnlyRequired,
  play: async ctx => {
    await clickRegister(ctx);
  },
};

const customSchema = z.object({
  password: z.string().min(16),
});

export const WithCustomValidation: StoryObj = {
  ...OnlyPasswordInvalid,
  args: {
    ...OnlyPasswordInvalid.args,
    schema: customSchema,
  },
};

export const WithChallengeError: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    challenge: {
      error: new ApolloError({ errorMessage: 'Something went wrong.' }),
    },
  },
};

export const WithChallengeLoading: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    challenge: {
      loading: true,
    },
  },
};

export const WithRegisterError: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    register: {
      error: new ApolloError({ errorMessage: 'Email already in use.' }),
    },
  },
};

export const WithRegisterLoading: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    register: {
      loading: true,
    },
  },
};
