import {Meta, StoryObj} from '@storybook/react'
import {z} from 'zod'
import {EmailInputSchema} from './email/email'
import {action} from '@storybook/addon-actions'
import {PasswordInputSchema} from './password/password'
import {ZIPInputSchema} from './zip/zip'
import {createSelectInputSchema} from './select/select'
import {TagInputSchema} from './tag/tag'
import {createTextareaInputSchema} from './textarea/textarea'
import {Button} from '../button/button'
import {StandardForm} from '../form-layouts/standard'
import {MultistepForm} from '../form-layouts/multistep'
import {HeaderForm} from '../form-layouts/header'
import {SectionForm} from '../form-layouts/section'
import {PropertiesInputSchema} from '../form-domain/properties/properties'
import {ImageArrayInputSchema} from '../form-domain/image/image'
import {LinksInputSchema} from '../form-domain/links/links'

export default {
  title: 'UI/Form',
  component: StandardForm
} as Meta<typeof StandardForm>

export const Standard = {
  args: {
    schema: z.object({
      name: z.string().min(1).describe('Name'),
      email: EmailInputSchema.describe('E-Mail'),
      password: PasswordInputSchema.describe(
        'Passwort // Keep your password safe! We do not have a recovery yet'
      ),
      consent: z.boolean().describe('Sign me up for the newsletter')
    }),
    defaultValues: {
      consent: true
    },
    renderAfter: () => <Button type="submit">Signup</Button>,
    onSubmit: action('submit')
  }
} as StoryObj<typeof StandardForm>

export const Section = {
  args: {
    sections: [
      {
        title: 'Account',
        schema: z.object({
          avatar: ImageArrayInputSchema.describe('Avatar'),
          name: z.string().min(1).describe('Name'),
          email: EmailInputSchema.describe('E-Mail'),
          password: PasswordInputSchema.describe(
            'Passwort // Keep your password safe! We do not have a recovery yet'
          )
        })
      },
      {
        title: 'Preferences',
        schema: z
          .object({
            favouriteBand: createSelectInputSchema(z.enum(['Nickleback', 'Foofighters'])).describe(
              'Your favourite band // Obviously not Nickleback'
            ),
            favouriteColors: TagInputSchema.describe("Your favourite colors // Don't choose green"),
            about: createTextareaInputSchema(z.string().max(255)).describe(
              'Über dich // Deine Geheimnisse sind bei uns sicher'
            )
          })
          .partial(),
        props: {
          favouriteColors: {
            items: [
              {value: 'black', label: 'Black'},
              {value: 'red', label: 'Red'},
              {value: 'green', label: 'Grün'}
            ]
          }
        },
        optional: true
      },
      {
        title: 'Consents',
        schema: z.object({
          zip: ZIPInputSchema.describe('PLZ (optional)').nullish(),
          consent: z.boolean().default(true).describe('Sign me up for the newsletter')
        }),
        defaultValues: {
          consent: true
        }
      },
      {
        title: 'Properties',
        schema: z.object({
          properties: PropertiesInputSchema
        })
      },
      {
        title: 'Links',
        schema: z.object({
          links: LinksInputSchema
        })
      }
    ] as const,
    onSubmit: action('submit')
  },
  render: args => <SectionForm {...args} />
} as StoryObj<typeof SectionForm>

export const Multistep = {
  args: {
    steps: [
      {
        title: 'Account',
        schema: z.object({
          name: z.string().min(1).describe('Name'),
          email: EmailInputSchema.describe('E-Mail'),
          password: PasswordInputSchema.describe(
            'Passwort // Keep your password safe! We do not have a recovery yet'
          )
        })
      },
      {
        title: 'Preferences',
        schema: z
          .object({
            about: createTextareaInputSchema(z.string().max(255)).describe(
              'Über dich // Deine Geheimnisse sind bei uns sicher'
            ),
            favouriteBand: createSelectInputSchema(z.enum(['Nickleback', 'Foofighters'])).describe(
              'Your favourite band // Obviously not Nickleback'
            ),
            favouriteColors: TagInputSchema.describe("Your favourite colors // Don't choose green")
          })
          .partial(),
        props: {
          favouriteColors: {
            items: [
              {value: 'black', label: 'Black'},
              {value: 'red', label: 'Red'},
              {value: 'green', label: 'Grün'}
            ]
          }
        },
        optional: true
      },
      {
        title: 'Consents',
        schema: z.object({
          zip: ZIPInputSchema.describe('PLZ (optional)').nullish(),
          consent: z.boolean().default(true).describe('Sign me up for the newsletter')
        }),
        defaultValues: {
          consent: true
        }
      }
    ] as const,
    onSubmit: action('submit')
  },
  render: args => <MultistepForm {...args} />
} as StoryObj<typeof MultistepForm>

export const Header = {
  args: {
    schema: z.object({
      state: createSelectInputSchema(z.enum(['all', 'draft', 'pending', 'published'])),
      sort: createSelectInputSchema(z.enum(['asc', 'desc', 'desc-updated']))
    }),
    props: {
      state: {
        items: [
          {value: 'all', label: 'All articles'},
          {value: 'draft', label: 'Draft articles'},
          {value: 'pending', label: 'Pending articles'},
          {value: 'published', label: 'Published articles'}
        ]
      },
      sort: {
        items: [
          {value: 'desc', label: 'Newest first'},
          {value: 'asc', label: 'Oldest first'},
          {value: 'desc-updated', label: 'Recently updated'}
        ]
      }
    },
    defaultValues: {
      state: 'all',
      sort: 'desc'
    },
    onSubmit: action('submit')
  },
  render: args => <HeaderForm {...args} />
} as StoryObj<typeof HeaderForm>
