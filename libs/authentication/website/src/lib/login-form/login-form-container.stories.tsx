import {css} from '@emotion/react'
import {action} from '@storybook/addon-actions'
import {StoryObj} from '@storybook/react'
import {LoginWithCredentialsDocument, LoginWithEmailDocument} from '@wepublish/website/api'
import {LoginFormContainer} from './login-form-container'
import * as loginFormStories from './login-form.stories'

export default {
  title: 'Container/Login Form',
  component: LoginFormContainer
}

export const WithEmail: StoryObj = {
  args: {
    onLoginWithEmail: action('onLoginWithEmail'),
    onLoginWithCredentials: action('onLoginWithCredentials')
  },
  play: loginFormStories.WithEmailFilled.play,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoginWithEmailDocument,
            variables: {
              email: 'foobar@email.com'
            }
          },
          result: {
            data: {sendWebsiteLogin: 'foobar@email.com'}
          }
        }
      ]
    }
  }
}

export const WithCredentials: StoryObj = {
  args: {
    onLoginWithEmail: action('onLoginWithEmail'),
    onLoginWithCredentials: action('onLoginWithCredentials')
  },
  play: loginFormStories.WithCredentialsFilled.play,
  parameters: {
    apolloClient: {
      mocks: [
        {
          request: {
            query: LoginWithCredentialsDocument,
            variables: {
              email: 'foobar@email.com',
              password: '12345678'
            }
          },
          result: {
            data: {
              createSession: {
                createdAt: new Date('2023-01-01'),
                expiresAt: new Date('2023-02-01'),
                token: '1234-1234'
              }
            }
          }
        }
      ]
    }
  }
}

export const WithClassName: StoryObj = {
  args: {
    onLoginWithEmail: action('onLoginWithEmail'),
    onLoginWithCredentials: action('onLoginWithCredentials'),
    className: 'extra-classname'
  }
}

export const WithEmotion: StoryObj = {
  args: {
    onLoginWithEmail: action('onLoginWithEmail'),
    onLoginWithCredentials: action('onLoginWithCredentials'),
    css: css`
      background-color: #eee;
    `
  }
}
