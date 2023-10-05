import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {StoryObj} from '@storybook/react'
import {userEvent, within} from '@storybook/testing-library'
import {WithUserDecorator} from '@wepublish/storybook'
import {
  FullImageFragment,
  UpdatePasswordDocument,
  UpdateUserDocument,
  User
} from '@wepublish/website/api'
import {PersonalDataFormFields} from '@wepublish/website/builder'
import {PersonalDataFormContainer} from './personal-data-form-container'
import * as personalDataFormStories from './personal-data-form.stories'

export default {
  title: 'Container/Personal Data Form',
  component: PersonalDataFormContainer
}

const mockUser: PersonalDataFormFields = {
  firstName: 'Kamil',
  name: 'Wasyl',
  email: 'some-example@mail.com',
  password: 'password123',
  flair: 'Financial Advisor & CEO',
  address: {
    streetAddress: 'Cool Street',
    zipCode: '12345',
    city: 'Surfers Paradise',
    country: 'Australia'
  },
  image: {
    __typename: 'Image',
    id: 'ljh9FHAvHAs0AxC',
    mimeType: 'image/jpg',
    format: 'jpg',
    createdAt: '2023-04-18T12:38:56.369Z',
    modifiedAt: '2023-04-18T12:38:56.371Z',
    filename: 'DSC07717',
    extension: '.JPG',
    width: 4000,
    height: 6000,
    fileSize: 8667448,
    description: null,
    tags: [],
    source: null,
    link: null,
    license: null,
    focalPoint: {
      x: 0.5,
      y: 0.5
    },
    title: null,
    url: 'https://unsplash.it/500/281',
    bigURL: 'https://unsplash.it/800/400',
    largeURL: 'https://unsplash.it/500/300',
    mediumURL: 'https://unsplash.it/300/200',
    smallURL: 'https://unsplash.it/200/100',
    squareBigURL: 'https://unsplash.it/800/800',
    squareLargeURL: 'https://unsplash.it/500/500',
    squareMediumURL: 'https://unsplash.it/300/300',
    squareSmallURL: 'https://unsplash.it/200/200'
  } as FullImageFragment
}

const onUpdateVariables = {
  input: {
    email: 'some-example@mail.com',
    name: 'WasylBar',
    firstName: 'KamilFoo',
    flair: 'Financial Advisor & CEO',
    address: {
      streetAddress: 'Cool StreetMusterstrasse 1',
      zipCode: '123458047',
      city: 'Surfers ParadiseZürich',
      country: 'AustraliaSchweiz'
    },
    preferredName: ''
  }
}

const onUpdatePasswordVariables = {password: '12345678', passwordRepeated: '12345678'}

export const Default: StoryObj = {
  args: {
    onUpdate: action('onUpdate')
  },
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: UpdateUserDocument,
            variables: onUpdateVariables
          },
          result: {
            data: {
              updateUser: {
                id: 'cllpd43yf11301882sfrvd9qom0w',
                name: 'Gojny',
                firstName: 'Emil',
                email: 'emilgojny69@gmail.com',
                preferredName: null,
                address: {
                  company: null,
                  streetAddress: 'street',
                  streetAddress2: null,
                  zipCode: '12345',
                  city: 'asdf',
                  country: 'Australia',
                  __typename: 'UserAddress'
                },
                flair: 'CEO & Advisor',
                paymentProviderCustomers: [],
                image: {
                  id: '7GMQjdJFo1hFTfV',
                  title: null,
                  description: null,
                  tags: [],
                  source: null,
                  license: null,
                  fileSize: 241657,
                  extension: '.jpeg',
                  mimeType: 'image/jpeg',
                  format: 'jpeg',
                  width: 700,
                  height: 1517,
                  focalPoint: null,
                  url: 'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/wallpaper_small.jpeg',
                  xsUrl:
                    'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/t/w_1500/wallpaper_small.jpeg',
                  smUrl:
                    'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/t/w_2000/wallpaper_small.jpeg',
                  mdAndUpUrl:
                    'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/t/w_2500/wallpaper_small.jpeg',
                  __typename: 'Image'
                },
                __typename: 'User'
              }
            }
          }
        },
        {
          request: {
            query: UpdatePasswordDocument,
            variables: onUpdatePasswordVariables
          },
          result: {
            data: {
              updatePassword: {
                id: 'cllpd43yf11301882sfrvd9qom0w',
                name: 'Gojny',
                firstName: 'Emil',
                email: 'emilgojny69@gmail.com',
                preferredName: null,
                address: {
                  company: null,
                  streetAddress: 'street',
                  streetAddress2: null,
                  zipCode: '12345',
                  city: 'asdf',
                  country: 'Australia',
                  __typename: 'UserAddress'
                },
                flair: 'CEO & Advisor',
                paymentProviderCustomers: [],
                image: {
                  id: '7GMQjdJFo1hFTfV',
                  title: null,
                  description: null,
                  tags: [],
                  source: null,
                  license: null,
                  fileSize: 241657,
                  extension: '.jpeg',
                  mimeType: 'image/jpeg',
                  format: 'jpeg',
                  width: 700,
                  height: 1517,
                  focalPoint: null,
                  url: 'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/wallpaper_small.jpeg',
                  xsUrl:
                    'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/t/w_1500/wallpaper_small.jpeg',
                  smUrl:
                    'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/t/w_2000/wallpaper_small.jpeg',
                  mdAndUpUrl:
                    'https://bajour-media01.wepublish.cloud/7GMQjdJFo1hFTfV/t/w_2500/wallpaper_small.jpeg',
                  __typename: 'Image'
                },
                __typename: 'User'
              }
            }
          }
        }
      ]
    }
  },
  decorators: [WithUserDecorator(mockUser as User)]
}

export const Filled: StoryObj = {
  ...Default,
  args: {
    ...Default.args
  },
  play: async ctx => {
    await personalDataFormStories.Filled.play?.(ctx)
  }
}

export const DeleteImage: StoryObj = {
  ...Default,
  play: async ({canvasElement, step}) => {
    const canvas = within(canvasElement)

    const button = canvas.getByTitle('Bild löschen')

    await step('Click delete image', async () => {
      await userEvent.click(button)
    })
  }
}

export const WithClassName: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}
