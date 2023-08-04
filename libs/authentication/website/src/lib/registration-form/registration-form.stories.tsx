import {action} from '@storybook/addon-actions'
import {Meta, StoryObj} from '@storybook/react'
import {RegistrationForm} from './registration-form'
import {ApolloError} from '@apollo/client'
import {userEvent, within} from '@storybook/testing-library'
import {ComponentProps} from 'react'
import {useArgs} from '@storybook/preview-api'
import z from 'zod'
import {challenge} from '@wepublish/testing/fixtures/graphql'

const Render = () => {
  const [args, updateArgs] = useArgs()
  const props = args as ComponentProps<typeof RegistrationForm>

  return (
    <RegistrationForm
      {...props}
      onRegister={data => {
        args.onRegister(data)
        updateArgs({
          register: {
            loading: true
          }
        })
      }}
    />
  )
}

export default {
  title: 'Components/Registration Form',
  component: RegistrationForm,
  render: Render
} as Meta

const fillFirstName: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Vorname', {
    selector: 'input'
  })

  await step('Enter firstname', async () => {
    await userEvent.click(input)
    await userEvent.type(input, 'Foo')
  })
}

const fillPreferredName: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Bevorzugter Name', {
    selector: 'input'
  })

  await step('Enter preferred name', async () => {
    await userEvent.click(input)
    await userEvent.type(input, 'Baz')
  })
}

const fillName: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Nachname', {
    selector: 'input'
  })

  await step('Enter name', async () => {
    await userEvent.click(input)
    await userEvent.type(input, 'Bar')
  })
}

const fillEmail: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Email', {
    selector: 'input'
  })

  await step('Enter email', async () => {
    await userEvent.click(input)
    await userEvent.type(input, 'foobar@email.com')
  })
}

const fillPassword: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Passwort', {
    selector: 'input'
  })

  await step('Enter password', async () => {
    await userEvent.click(input)
    await userEvent.type(input, '12345678')
  })
}

const fillStreetName: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Address', {
    selector: 'input'
  })

  await step('Enter streetName', async () => {
    await userEvent.click(input)
    await userEvent.type(input, 'Musterstrasse 1')
  })
}

const fillZip: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Postleitzahl', {
    selector: 'input'
  })

  await step('Enter zip', async () => {
    await userEvent.click(input)
    await userEvent.type(input, '8047')
  })
}

const fillCity: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Stadt', {
    selector: 'input'
  })

  await step('Enter city', async () => {
    await userEvent.click(input)
    await userEvent.type(input, 'Zürich')
  })
}

const fillCountry: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Land', {
    selector: 'input'
  })

  await step('Enter country', async () => {
    await userEvent.click(input)
    await userEvent.type(input, 'Schweiz')
  })
}

const fillCaptcha: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Captcha', {
    selector: 'input'
  })

  await step('Enter captcha', async () => {
    await userEvent.click(input)
    await userEvent.type(input, '1')
  })
}

const clickRegister: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)
  const submitButton = canvas.getByText('Registrieren')

  await step('Submit form', async () => {
    await userEvent.click(submitButton)
  })
}

const fillRequired: StoryObj['play'] = async ctx => {
  const {step} = ctx

  await step('Enter required credentials', async () => {
    await fillName(ctx)
    await fillEmail(ctx)
    await fillCaptcha(ctx)
  })
}

const fillAddress: StoryObj['play'] = async ctx => {
  const {step} = ctx

  await step('Enter address', async () => {
    await fillStreetName(ctx)
    await fillZip(ctx)
    await fillCity(ctx)
    await fillCountry(ctx)
  })
}

export const Default: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {}
  }
}

export const Filled: StoryObj = {
  ...Default,
  play: async ctx => {
    await fillRequired(ctx)
    await fillFirstName(ctx)
    await fillPassword(ctx)
    await fillAddress(ctx)
    await clickRegister(ctx)
  }
}

export const Invalid: StoryObj = {
  ...Default,
  play: async ctx => {
    await clickRegister(ctx)
  }
}

export const OnlyFirstName: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {},
    fields: ['firstName']
  }
}

export const OnlyFirstNameFilled: StoryObj = {
  ...OnlyFirstName,
  play: async ctx => {
    await fillRequired(ctx)
    await fillFirstName(ctx)
    await clickRegister(ctx)
  }
}

export const OnlyFirstNameInvalid: StoryObj = {
  ...OnlyFirstName,
  play: async ctx => {
    await clickRegister(ctx)
  }
}

export const OnlyPreferredName: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {},
    fields: ['preferredName']
  }
}

export const OnlyPreferredNameFilled: StoryObj = {
  ...OnlyPreferredName,
  play: async ctx => {
    await fillRequired(ctx)
    await fillPreferredName(ctx)
    await clickRegister(ctx)
  }
}

export const OnlyPreferredNameInvalid: StoryObj = {
  ...OnlyPreferredName,
  play: async ctx => {
    await clickRegister(ctx)
  }
}

export const OnlyAddress: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {},
    fields: ['address']
  }
}

export const OnlyAddressFilled: StoryObj = {
  ...OnlyAddress,
  play: async ctx => {
    await fillRequired(ctx)
    await fillAddress(ctx)
    await clickRegister(ctx)
  }
}

export const OnlyAddressInvalid: StoryObj = {
  ...OnlyAddress,
  play: async ctx => {
    await clickRegister(ctx)
  }
}

export const OnlyPassword: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {},
    fields: ['password']
  }
}

export const OnlyPasswordFilled: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await fillRequired(ctx)
    await fillPassword(ctx)
    await clickRegister(ctx)
  }
}

export const OnlyPasswordInvalid: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await clickRegister(ctx)
  }
}

export const OnlyRequired: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {},
    fields: []
  }
}

export const OnlyRequiredFilled: StoryObj = {
  ...OnlyRequired,
  play: async ctx => {
    await fillRequired(ctx)
    await clickRegister(ctx)
  }
}

export const OnlyRequiredInvalid: StoryObj = {
  ...OnlyRequired,
  play: async ctx => {
    await clickRegister(ctx)
  }
}

const customSchema = z.object({
  password: z.string().min(16)
})

export const WithCustomValidation: StoryObj = {
  ...OnlyPasswordInvalid,
  args: {
    ...OnlyPasswordInvalid.args,
    schema: customSchema
  }
}

export const WithChallengeError: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      error: new ApolloError({errorMessage: 'Something went wrong.'})
    },
    register: {}
  }
}

export const WithChallengeLoading: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      loading: true
    },
    register: {}
  }
}

export const WithRegisterError: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {
      error: new ApolloError({errorMessage: 'Email already in use.'})
    }
  }
}

export const WithRegisterLoading: StoryObj = {
  args: {
    onRegister: action('onRegister'),
    challenge: {
      data: {challenge}
    },
    register: {
      loading: true
    }
  }
}
