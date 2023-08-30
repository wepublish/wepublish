import {ApolloError} from '@apollo/client'
import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {StoryObj} from '@storybook/react'
import {SessionTokenContext, useUser} from '@wepublish/authentication/website'
import {FullImageFragment, UpdateUserDocument, User} from '@wepublish/website/api'
import {PersonalDataFormFields} from '@wepublish/website/builder'
import {ComponentType} from 'react'
import {PersonalDataFormContainer} from './personal-data-form-container'
import * as personalDataFormStories from './personal-data-form.stories'

export default {
  title: 'Container/PersonalData Form',
  component: PersonalDataFormContainer
}

const WithUserDecorator = (Story: ComponentType) => {
  return (
    <SessionTokenContext.Provider
      value={[
        mockUser as User,
        true,
        () => {
          /* do nothing */
        }
      ]}>
      <Story />
    </SessionTokenContext.Provider>
  )
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
  name: 'Bar',
  email: 'foobar@email.com',
  firstName: 'Foo',
  address: {streetAddress: 'Musterstrasse 1', zipCode: '8047', city: 'Zürich', country: 'Schweiz'},
  password: '12345678'
}

export const Default: StoryObj = {
  render: function Render(args) {
    const {user} = useUser()

    return (
      <>
        {user && <div>Logged in as {user?.firstName}</div>}
        <PersonalDataFormContainer {...args} />
      </>
    )
  },
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
        }
      ]
    }
  },
  decorators: [WithUserDecorator]
}

export const Filled: StoryObj = {
  render: function Render(args) {
    const {user} = useUser()

    return (
      <>
        {user && <div>Logged in as {user?.firstName}</div>}
        <PersonalDataFormContainer {...args} />
      </>
    )
  },
  args: {
    onUpdate: action('onUpdate')
  },
  play: async ctx => {
    await personalDataFormStories.Filled.play?.(ctx)
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
        }
      ]
    }
  },
  decorators: [WithUserDecorator]
}

export const WithUpdateError: StoryObj = {
  args: {
    onUpdate: action('onUpdate')
  },
  play: Filled.play,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: UpdateUserDocument,
            variables: onUpdateVariables
          },
          result: {
            errors: [new ApolloError({errorMessage: 'Incorrect data provided.'})]
          }
        }
      ]
    }
  },
  decorators: [WithUserDecorator]
}

export const WithClassName: StoryObj = {
  render: function Render(args) {
    const {user} = useUser()

    return (
      <>
        {user && <div>Logged in as {user?.firstName}</div>}
        <PersonalDataFormContainer {...args} />
      </>
    )
  },
  args: {
    onUpdate: action('onUpdate'),
    className: 'extra-classname'
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
        }
      ]
    }
  },
  decorators: [WithUserDecorator]
}

export const WithEmotion: StoryObj = {
  render: function Render(args) {
    const {user} = useUser()

    return (
      <>
        {user && <div>Logged in as {user?.firstName}</div>}
        <PersonalDataFormContainer {...args} />
      </>
    )
  },
  args: {
    onUpdate: action('onUpdate'),
    css: css`
      background-color: #eee;
    `
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
        }
      ]
    }
  },
  decorators: [WithUserDecorator]
}
