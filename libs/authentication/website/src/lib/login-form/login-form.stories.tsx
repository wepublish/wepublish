import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LoginForm } from './login-form';
import { action } from 'storybook/actions';
import { expect, userEvent, within } from 'storybook/test';
import { useArgs } from 'storybook/preview-api';
import { ComponentProps } from 'react';
import { ApolloError } from '@apollo/client';

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

  await step('Enter password', async () => {
    await userEvent.click(input);
    await userEvent.type(input, '12345678');
  });
};

const switchToPasswordLogin: StoryObj['play'] = async ({
  canvasElement,
  step,
}) => {
  const canvas = within(canvasElement);
  const passwordLoginButton = canvas.getByRole('button', {
    name: 'Mit Passwort einloggen',
  });

  await step('Switch to password login', async () => {
    await userEvent.click(passwordLoginButton);
  });
};

const requestLoginLink: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const linkLoginButton = canvas.getByRole('button', {
    name: 'Mit Link einloggen',
  });

  await step('Request login link', async () => {
    await userEvent.click(linkLoginButton);
  });
};

const submitCredentials: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByRole('button', { name: 'Einloggen' });

  await step('Submit credentials', async () => {
    await userEvent.click(submitButton);
  });
};

const Render = () => {
  const [args, updateArgs] = useArgs();
  const props = args as ComponentProps<typeof LoginForm>;

  return (
    <LoginForm
      {...props}
      onSubmitLoginWithEmail={email => {
        args.onSubmitLoginWithEmail();
        updateArgs({
          loginWithEmail: {
            data: { sendWebsiteLogin: email },
          },
        });
      }}
      onSubmitLoginWithCredentials={() => {
        args.onSubmitLoginWithCredentials();
        updateArgs({
          loginWithCredentials: {
            loading: true,
          },
        });
      }}
    />
  );
};

export default {
  title: 'Components/Login Form',
  component: LoginForm,
  render: Render,
} as Meta;

export const WithEmail: StoryObj = {
  args: {
    loginWithCredentials: {},
    onSubmitLoginWithCredentials: action('onSubmitLoginWithCredentials'),
    loginWithEmail: {},
    onSubmitLoginWithEmail: action('onSubmitLoginWithEmail'),
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Offers both login methods and hides the password', async () => {
      canvas.getByRole('button', { name: 'Mit Link einloggen' });
      canvas.getByRole('button', { name: 'Mit Passwort einloggen' });
      expect(
        canvas.queryByLabelText('Passwort', { selector: 'input' })
      ).toBeNull();
    });
  },
};

export const WithEmailFilled: StoryObj = {
  ...WithEmail,
  play: async ctx => {
    await fillEmail(ctx);
    await requestLoginLink(ctx);
  },
};

export const WithEmailInvalid: StoryObj = {
  ...WithEmail,
  play: requestLoginLink,
};

export const WithEmailError: StoryObj = {
  ...WithEmailFilled,
  render: function Render() {
    const [args, updateArgs] = useArgs();
    const props = args as ComponentProps<typeof LoginForm>;

    return (
      <LoginForm
        {...props}
        onSubmitLoginWithEmail={email => {
          args.onSubmitLoginWithEmail();
          updateArgs({
            loginWithEmail: {
              error: new ApolloError({ errorMessage: 'Something went wrong.' }),
            },
          });
        }}
        onSubmitLoginWithCredentials={() => {
          args.onSubmitLoginWithCredentials();
          updateArgs({
            loginWithCredentials: {
              loading: true,
            },
          });
        }}
      />
    );
  },
};

export const WithPasswordLoginDisabled: StoryObj = {
  args: {
    ...WithEmail.args,
    disablePasswordLogin: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Only offers the login link', async () => {
      canvas.getByRole('button', { name: 'Mit Link einloggen' });
      expect(
        canvas.queryByRole('button', { name: 'Mit Passwort einloggen' })
      ).toBeNull();
    });
  },
};

export const WithCredentials: StoryObj = {
  args: {
    loginWithCredentials: {},
    onSubmitLoginWithCredentials: action('onSubmitLoginWithCredentials'),
    loginWithEmail: {},
    onSubmitLoginWithEmail: action('onSubmitLoginWithEmail'),
  },
  play: async ctx => {
    await switchToPasswordLogin(ctx);

    const canvas = within(ctx.canvasElement);

    await ctx.step('Reveals the password field', async () => {
      const password = canvas.getByLabelText('Passwort', {
        selector: 'input',
      });

      canvas.getByRole('button', { name: 'Einloggen' });
      canvas.getByRole('button', {
        name: 'Stattdessen Login-Link per E-Mail',
      });
      expect(password).toHaveFocus();
    });
  },
};

export const WithCredentialsFilled: StoryObj = {
  ...WithCredentials,
  play: async ctx => {
    await switchToPasswordLogin(ctx);
    await fillEmail(ctx);
    await fillPassword(ctx);
    await submitCredentials(ctx);
  },
};

export const WithCredentialsInvalid: StoryObj = {
  ...WithCredentials,
  play: async ctx => {
    await switchToPasswordLogin(ctx);
    await submitCredentials(ctx);
  },
};

export const WithCredentialsAndOtp: StoryObj = {
  args: {
    ...WithCredentials.args,
    otpRequired: true,
  },
  play: async ctx => {
    await switchToPasswordLogin(ctx);

    const canvas = within(ctx.canvasElement);

    await ctx.step('Reveals the 2FA field', async () => {
      canvas.getByLabelText('Bestätigungscode (2FA)', { selector: 'input' });
    });
  },
};

export const WithTotpRedirectToPassword: StoryObj = {
  args: {
    ...WithCredentials.args,
    otpRequired: true,
    totpRedirectToPassword: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Starts in password mode without a way back', async () => {
      canvas.getByLabelText('Passwort', { selector: 'input' });
      canvas.getByLabelText('Bestätigungscode (2FA)', { selector: 'input' });
      expect(
        canvas.queryByRole('button', {
          name: 'Stattdessen Login-Link per E-Mail',
        })
      ).toBeNull();
    });
  },
};

export const WithCredentialsError: StoryObj = {
  ...WithCredentialsFilled,
  render: function Render() {
    const [args, updateArgs] = useArgs();
    const props = args as ComponentProps<typeof LoginForm>;

    return (
      <LoginForm
        {...props}
        onSubmitLoginWithEmail={email => {
          args.onSubmitLoginWithEmail();
          updateArgs({
            loginWithEmail: {
              data: { sendWebsiteLogin: email },
            },
          });
        }}
        onSubmitLoginWithCredentials={() => {
          args.onSubmitLoginWithCredentials();
          updateArgs({
            loginWithCredentials: {
              error: new ApolloError({ errorMessage: 'Invalid Credentials' }),
            },
          });
        }}
      />
    );
  },
};
