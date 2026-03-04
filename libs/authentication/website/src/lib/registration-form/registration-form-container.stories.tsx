import { StoryObj } from '@storybook/react';
import {
  CaptchaType,
  Challenge,
  ChallengeDocument,
  RegisterDocument,
} from '@wepublish/website/api';
import { RegistrationFormContainer } from './registration-form-container';
import * as registrationFormStories from './registration-form.stories';
import { ApolloError } from '@apollo/client';
import { useUser } from '../session.context';

export default {
  title: 'Container/Registration Form',
  component: RegistrationFormContainer,
};

const challenge = {
  challengeID: '1x00000000000000000000AA',
  challenge: null,
  validUntil: null,
  type: CaptchaType.CfTurnstile,
  __typename: 'Challenge',
} as Challenge;

const registerVariables = {
  name: 'Bar',
  email: 'foobar@email.com',
  challengeAnswer: {
    challengeSolution: '1',
    challengeID: challenge.challengeID,
  },
  firstName: 'Foo',
  address: {
    streetAddress: 'Musterstrasse 1',
    zipCode: '8047',
    city: 'Zürich',
    country: 'Schweiz',
  },
  password: '12345678',
};

export const Filled: StoryObj = {
  render: function Render(args) {
    const { user } = useUser();

    return (
      <>
        {user && <div>Logged in as {user?.firstName}</div>}
        <RegistrationFormContainer {...args} />
      </>
    );
  },
  args: {},
  play: async ctx => {
    await registrationFormStories.Filled.play?.(ctx);
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument,
          },
          result: {
            data: { challenge },
          },
        },
        {
          request: {
            query: RegisterDocument,
            variables: registerVariables,
          },
          result: {
            data: {
              registerMember: {
                session: {
                  createdAt: new Date('2023-01-01'),
                  expiresAt: new Date('2023-01-01'),
                  token: '1234-1234',
                },
                user: {
                  id: '1234-1234',
                  firstName: 'Foo',
                  name: 'Bar',
                  email: 'foobar@example.com',
                  paymentProviderCustomers: [],
                  properties: [],
                },
              },
            },
          },
        },
      ],
    },
  },
};

export const WithChallengeError: StoryObj = {
  args: {},
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument,
          },
          result: {
            errors: [
              new ApolloError({ errorMessage: 'Something went wrong.' }),
            ],
          },
        },
        {
          request: {
            query: RegisterDocument,
          },
          result: {
            data: {},
          },
        },
      ],
    },
  },
};

export const WithRegisterError: StoryObj = {
  args: {},
  play: Filled.play,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: ChallengeDocument,
          },
          result: {
            data: { challenge },
          },
        },
        {
          request: {
            query: RegisterDocument,
            variables: registerVariables,
          },
          result: {
            errors: [
              new ApolloError({ errorMessage: 'Email already in use.' }),
            ],
          },
        },
        {
          request: {
            query: ChallengeDocument,
          },
          result: {
            data: {
              challenge,
            },
          },
        },
      ],
    },
  },
};
