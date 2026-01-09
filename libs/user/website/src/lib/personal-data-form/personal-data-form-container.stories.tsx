import { action } from '@storybook/addon-actions';
import { StoryObj } from '@storybook/react';
import { WithUserDecorator } from '@wepublish/storybook';
import {
  UpdatePasswordDocument,
  UpdateUserDocument,
  User,
} from '@wepublish/website/api';
import { PersonalDataFormContainer } from './personal-data-form-container';
import * as personalDataFormStories from './personal-data-form.stories';
import { mockImage } from '@wepublish/storybook/mocks';

export default {
  title: 'Container/Personal Data Form',
  component: PersonalDataFormContainer,
};

const mockUser: User = {
  id: '1234',
  firstName: 'Kamil',
  name: 'Wasyl',
  email: 'some-example@mail.com',
  flair: 'Financial Advisor & CEO',
  address: {
    streetAddress: 'Cool Street',
    streetAddressNumber: '1234',
    zipCode: '12345',
    city: 'Surfers Paradise',
    country: 'Australia',
  },
  image: mockImage(),
  paymentProviderCustomers: [],
};

const onUpdateVariables = {
  input: {
    email: 'some-example@mail.com',
    name: 'WasylBar',
    firstName: 'KamilFoo',
    flair: 'Financial Advisor & CEO',
    address: {
      streetAddress: 'Cool StreetMusterstrasse',
      streetAddressNumber: '1',
      zipCode: '123458047',
      city: 'Surfers ParadiseZürich',
      country: 'Schweiz',
    },
  },
};

const onUpdatePasswordVariables = {
  password: '12345678',
  passwordRepeated: '12345678',
};

export const Default: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: UpdateUserDocument,
            variables: onUpdateVariables,
          },
          result: {
            data: {
              updateUser: {
                id: 'cllpd43yf11301882sfrvd9qom0w',
                name: 'Gojny',
                firstName: 'Emil',
                email: 'emilgojny69@gmail.com',
                address: {
                  company: null,
                  streetAddress: 'street',
                  streetAddressNumber: '1234',
                  streetAddress2: null,
                  zipCode: '12345',
                  city: 'asdf',
                  country: 'Australia',
                  __typename: 'UserAddress',
                },
                flair: 'CEO & Advisor',
                paymentProviderCustomers: [],
                image: mockImage(),
                __typename: 'User',
              },
            },
          },
        },
        {
          request: {
            query: UpdatePasswordDocument,
            variables: onUpdatePasswordVariables,
          },
          result: {
            data: {
              updatePassword: {
                id: 'cllpd43yf11301882sfrvd9qom0w',
                name: 'Gojny',
                firstName: 'Emil',
                email: 'emilgojny69@gmail.com',
                address: {
                  company: null,
                  streetAddress: 'street',
                  streetAddressNumber: '1234',
                  streetAddress2: null,
                  zipCode: '12345',
                  city: 'asdf',
                  country: 'Australia',
                  __typename: 'UserAddress',
                },
                flair: 'CEO & Advisor',
                paymentProviderCustomers: [],
                image: mockImage(),
                __typename: 'User',
              },
            },
          },
        },
      ],
    },
  },
  decorators: [WithUserDecorator(mockUser)],
};

export const Filled: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
  },
  play: async ctx => {
    await personalDataFormStories.Filled.play?.(ctx);
  },
};

// export const DeleteImage: StoryObj = {
//   ...Default,
//   play: async ({canvasElement, step}) => {
//     const canvas = within(canvasElement)

//     const button = canvas.getByTitle('Bild löschen')

//     await step('Click delete image', async () => {
//       await userEvent.click(button)
//     })
//   }
// }
