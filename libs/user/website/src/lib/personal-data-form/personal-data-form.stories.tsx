import {ApolloError} from '@apollo/client'
import {action} from '@storybook/addon-actions'
import {useArgs} from '@storybook/preview-api'
import {Meta, StoryObj} from '@storybook/react'
import {userEvent, within} from '@storybook/testing-library'
import {FullImageFragment} from '@wepublish/website/api'
import {PersonalDataFormFields} from '@wepublish/website/builder'
import {ComponentProps} from 'react'
import z from 'zod'
import {PersonalDataForm} from './personal-data-form'

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

const Render = () => {
  const [args, updateArgs] = useArgs()
  const props = args as ComponentProps<typeof PersonalDataForm>

  return (
    <PersonalDataForm
      {...props}
      initialUser={mockUser}
      onUpdate={data => {
        args.onUpdate(data)
        updateArgs({
          update: {
            loading: true
          }
        })
      }}
    />
  )
}

export default {
  title: 'Components/Personal Data Form',
  component: PersonalDataForm,
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

const fillFlair: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Function/Profession', {
    selector: 'input'
  })

  await step('Enter preferred name', async () => {
    await userEvent.click(input)
    await userEvent.clear(input)
    await userEvent.type(input, 'Wordpress Ninja & CSS Shaolin')
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

  const input = canvas.getByLabelText('Email (not editable)', {
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

const fillRepeatPassword: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)

  const input = canvas.getByLabelText('Repeat Passwort', {
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

const clickUpdate: StoryObj['play'] = async ({canvasElement, step}) => {
  const canvas = within(canvasElement)
  const submitButton = canvas.getByText('Save')

  await step('Submit form', async () => {
    await userEvent.click(submitButton)
  })
}

const fillRequired: StoryObj['play'] = async ctx => {
  const {step} = ctx

  await step('Enter required credentials', async () => {
    await fillName(ctx)
    await fillEmail(ctx)
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
    onUpdate: action('onUpdate'),
    update: {}
  }
}

export const WithMediaEmail: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    mediaEmail: 'some@email.com'
  }
}

export const Filled: StoryObj = {
  ...Default,
  play: async ctx => {
    await fillRequired(ctx)
    await fillFirstName(ctx)
    await fillPassword(ctx)
    await fillRepeatPassword(ctx)
    await fillAddress(ctx)
    await clickUpdate(ctx)
  }
}

export const Invalid: StoryObj = {
  ...Default,
  play: async ctx => {
    await clickUpdate(ctx)
  }
}

export const OnlyFirstName: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['firstName']
  }
}

export const OnlyFirstNameFilled: StoryObj = {
  ...OnlyFirstName,
  play: async ctx => {
    await fillRequired(ctx)
    await fillFirstName(ctx)
    await clickUpdate(ctx)
  }
}

export const OnlyFirstNameInvalid: StoryObj = {
  ...OnlyFirstName,
  play: async ctx => {
    await clickUpdate(ctx)
  }
}

export const OnlyPreferredName: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['preferredName']
  }
}

export const OnlyPreferredNameFilled: StoryObj = {
  ...OnlyPreferredName,
  play: async ctx => {
    await fillRequired(ctx)
    await fillPreferredName(ctx)
    await clickUpdate(ctx)
  }
}

export const OnlyPreferredNameInvalid: StoryObj = {
  ...OnlyPreferredName,
  play: async ctx => {
    await clickUpdate(ctx)
  }
}

export const OnlyFlair: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['flair']
  }
}

export const OnlyFlairFilled: StoryObj = {
  ...OnlyFlair,
  play: async ctx => {
    await fillRequired(ctx)
    await fillFlair(ctx)
    await clickUpdate(ctx)
  }
}

export const OnlyFlairInvalid: StoryObj = {
  ...OnlyFlair,
  play: async ctx => {
    await clickUpdate(ctx)
  }
}

export const OnlyAddress: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['address']
  }
}

export const OnlyAddressFilled: StoryObj = {
  ...OnlyAddress,
  play: async ctx => {
    await fillRequired(ctx)
    await fillAddress(ctx)
    await clickUpdate(ctx)
  }
}

export const OnlyAddressInvalid: StoryObj = {
  ...OnlyAddress,
  play: async ctx => {
    await clickUpdate(ctx)
  }
}

export const OnlyPassword: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: ['password']
  }
}

export const OnlyPasswordFilled: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await fillRequired(ctx)
    await fillPassword(ctx)
    await fillRepeatPassword(ctx)
    await clickUpdate(ctx)
  }
}

export const OnlyPasswordInvalid: StoryObj = {
  ...OnlyPassword,
  play: async ctx => {
    await clickUpdate(ctx)
  }
}

export const OnlyRequired: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {},
    fields: []
  }
}

export const OnlyRequiredFilled: StoryObj = {
  ...OnlyRequired,
  play: async ctx => {
    await fillRequired(ctx)
    await clickUpdate(ctx)
  }
}

export const OnlyRequiredInvalid: StoryObj = {
  ...OnlyRequired,
  play: async ctx => {
    await clickUpdate(ctx)
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

export const WithUpdateError: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {
      error: new ApolloError({errorMessage: 'Email already in use.'})
    }
  }
}

export const WithUpdateLoading: StoryObj = {
  args: {
    onUpdate: action('onUpdate'),
    update: {
      loading: true
    }
  }
}
