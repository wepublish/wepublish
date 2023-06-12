import {Meta, StoryObj} from '@storybook/react'
import {LoginForm} from './login-form'
import {action} from '@storybook/addon-actions'
import {userEvent, within} from '@storybook/testing-library'
import {useArgs} from '@storybook/preview-api'
import {ComponentProps} from 'react'
import {ApolloError} from '@apollo/client'

const Render = () => {
  const [args, updateArgs] = useArgs()
  const props = args as ComponentProps<typeof LoginForm>

  return (
    <LoginForm
      {...props}
      onSubmitLoginWithEmail={email => {
        args.onSubmitLoginWithEmail()
        updateArgs({
          loginWithEmail: {
            data: {sendWebsiteLogin: email}
          }
        })
      }}
      onSubmitLoginWithCredentials={() => {
        args.onSubmitLoginWithCredentials()
        updateArgs({
          loginWithCredentials: {
            loading: true
          }
        })
      }}
    />
  )
}

export default {
  title: 'Components/Login Form',
  component: LoginForm,
  render: Render
} as Meta

export const WithEmail: StoryObj = {
  args: {
    subscriptionPath: '/',
    loginWithCredentials: {},
    onSubmitLoginWithCredentials: action('onSubmitLoginWithCredentials'),
    loginWithEmail: {},
    onSubmitLoginWithEmail: action('onSubmitLoginWithEmail')
  }
}

export const WithEmailPlay: StoryObj = {
  ...WithEmail,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)

    const emailInput = canvas.getByLabelText('Email', {
      selector: 'input'
    })

    await userEvent.click(emailInput)
    await userEvent.type(emailInput, 'foobar@email.com', {
      delay: 100
    })

    const submitButton = canvas.getByRole('button')
    await userEvent.click(submitButton)
  }
}

export const WithCredentials: StoryObj = {
  args: {
    subscriptionPath: '/',
    loginWithCredentials: {},
    onSubmitLoginWithCredentials: action('onSubmitLoginWithCredentials'),
    loginWithEmail: {},
    onSubmitLoginWithEmail: action('onSubmitLoginWithEmail')
  }
}

export const WithCredentialsPlay: StoryObj = {
  ...WithCredentials,
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)

    const loginWithPasswordCheckbox = canvas.getByLabelText('Login mit Passwort', {
      selector: 'input'
    })
    await userEvent.click(loginWithPasswordCheckbox)

    const emailInput = canvas.getByLabelText('Email', {
      selector: 'input'
    })
    await userEvent.click(emailInput)
    await userEvent.type(emailInput, 'foobar@email.com', {
      delay: 100
    })

    const passwordInput = canvas.getByLabelText('Passwort', {
      selector: 'input'
    })
    await userEvent.tab()
    await userEvent.type(passwordInput, '12345678', {
      delay: 100
    })

    const submitButton = canvas.getByRole('button')
    await userEvent.click(submitButton)
  }
}

export const WithCredentialsError: StoryObj = {
  args: {
    subscriptionPath: '/',
    loginWithCredentials: {
      error: new ApolloError({errorMessage: 'Invalid Credentials'})
    },
    onSubmitLoginWithCredentials: action('onSubmitLoginWithCredentials'),
    loginWithEmail: {},
    onSubmitLoginWithEmail: action('onSubmitLoginWithEmail')
  },
  play: async ({canvasElement}) => {
    const canvas = within(canvasElement)

    const loginWithPasswordCheckbox = canvas.getByLabelText('Login mit Passwort', {
      selector: 'input'
    })
    await userEvent.click(loginWithPasswordCheckbox)
  }
}
