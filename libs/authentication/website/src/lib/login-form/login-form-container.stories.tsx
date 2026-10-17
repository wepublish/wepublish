import { StoryObj } from '@storybook/nextjs-vite';
import {
  LoginWithCredentialsDocument,
  LoginWithEmailDocument,
  SettingListDocument,
  SettingName,
} from '@wepublish/website/api';
import { expect, waitFor, within } from 'storybook/test';
import { LoginFormContainer } from './login-form-container';
import * as loginFormStories from './login-form.stories';

export default {
  title: 'Container/Login Form',
  component: LoginFormContainer,
};

export const WithEmail: StoryObj = {
  args: {},
  play: loginFormStories.WithEmailFilled.play,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoginWithEmailDocument,
            variables: {
              email: 'foobar@email.com',
            },
          },
          result: {
            data: { sendWebsiteLogin: 'foobar@email.com' },
          },
        },
      ],
    },
  },
};

export const WithCredentials: StoryObj = {
  args: {},
  play: loginFormStories.WithCredentialsFilled.play,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoginWithCredentialsDocument,
            variables: {
              email: 'foobar@email.com',
              password: '12345678',
            },
          },
          result: {
            data: {
              createSession: {
                createdAt: new Date('2023-01-01'),
                expiresAt: new Date('2023-02-01'),
                token: '1234-1234',
              },
            },
          },
        },
      ],
    },
  },
};

const loginCodeSetting = (enabled: boolean) => ({
  request: { query: SettingListDocument },
  result: {
    data: {
      settings: [
        {
          __typename: 'Setting',
          id: 'login-code-enabled',
          name: SettingName.LoginCodeEnabled,
          value: enabled,
        },
      ],
    },
  },
});

export const WithLoginCodesEnabled: StoryObj = {
  args: {},
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(() =>
      expect(canvas.getByText('Ich habe einen Login-Code')).toBeInTheDocument()
    );
  },
  parameters: {
    apolloClient: { mocks: [loginCodeSetting(true)] },
  },
};

export const WithLoginCodesDisabled: StoryObj = {
  args: {
    defaults: { useLoginCode: true, loginCode: 'ABCDE-FGHJK' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Even a link carrying a code falls back to the normal login form.
    await waitFor(() =>
      expect(canvas.queryByText('Ich habe einen Login-Code')).toBeNull()
    );
    expect(canvas.queryByDisplayValue('ABCDE-FGHJK')).toBeNull();
  },
  parameters: {
    apolloClient: { mocks: [loginCodeSetting(false)] },
  },
};
