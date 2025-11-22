import { Meta, StoryObj } from '@storybook/react';
import { LoginForm } from './login-form';
import { action } from '@storybook/addon-actions';
import { userEvent, within } from '@storybook/test';
import { useArgs } from '@storybook/preview-api';
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

const clickCheckbox: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const loginWithPasswordCheckbox = canvas.getByLabelText(
    'Login mit Passwort',
    {
      selector: 'input',
    }
  );

  await step('Click login with password', async () => {
    await userEvent.click(loginWithPasswordCheckbox);
  });
};

const clickLogin: StoryObj['play'] = async ({ canvasElement, step }) => {
  const canvas = within(canvasElement);
  const submitButton = canvas.getByRole('button');

  await step('Submit form', async () => {
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
};

export const WithEmailFilled: StoryObj = {
  ...WithEmail,
  play: async ctx => {
    await fillEmail(ctx);
    await clickLogin(ctx);
  },
};

export const WithEmailInvalid: StoryObj = {
  ...WithEmail,
  play: clickLogin,
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

export const WithCredentials: StoryObj = {
  args: {
    loginWithCredentials: {},
    onSubmitLoginWithCredentials: action('onSubmitLoginWithCredentials'),
    loginWithEmail: {},
    onSubmitLoginWithEmail: action('onSubmitLoginWithEmail'),
  },
  play: clickCheckbox,
};

export const WithCredentialsFilled: StoryObj = {
  ...WithCredentials,
  play: async ctx => {
    WithCredentials.play?.(ctx);
    await fillEmail(ctx);
    await fillPassword(ctx);
    await clickLogin(ctx);
  },
};

export const WithCredentialsInvalid: StoryObj = {
  ...WithCredentials,
  play: async ctx => {
    WithCredentials.play?.(ctx);

    await clickLogin(ctx);
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
