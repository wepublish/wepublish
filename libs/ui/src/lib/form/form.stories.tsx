import {Meta, StoryObj} from '@storybook/react'
import {EmailInputSchema} from './email/email'
import {action} from '@storybook/addon-actions'
import {PasswordInputSchema} from './password/password'
import {ZIPInputSchema} from './zip/zip'
import {TagInputSchema} from './tag/tag'
import {Button} from '../button/button'
import {StandardForm} from '../form-layouts/standard'
import {MultistepForm} from '../form-layouts/multistep'
import {HeaderForm} from '../form-layouts/header'
import {SectionForm} from '../form-layouts/section'
import {PropertiesInputSchema} from '../form-domain/properties/properties'
import {ImageArrayInputSchema} from '../form-domain/image/image'
import {LinksInputSchema} from '../form-domain/links/links'
import * as v from 'valibot'
import {TextareaInputSchema} from './textarea/textarea'
import {SELECT_BRANDING} from './select/select'

export default {
  title: 'UI/Form',
  component: StandardForm
} as Meta<typeof StandardForm>

export const Standard = {
  args: {
    schema: v.object({
      name: v.pipe(v.string(), v.nonEmpty(), v.title('Name')),
      email: v.pipe(EmailInputSchema, v.title('E-Mail')),
      password: v.pipe(
        PasswordInputSchema,
        v.nonEmpty(),
        v.title('Passwort'),
        v.description('Keep your password safe! We do not have a recovery yet')
      ),
      consent: v.pipe(v.boolean(), v.title('Sign me up for the newsletter'))
    }),
    defaultValues: {
      consent: true
    },
    renderAfter: () => <Button type="submit">Signup</Button>,
    onSubmit: action('submit')
  }
} as StoryObj<typeof StandardForm>

enum Bands {
  Nickleback = 'Nickleback',
  Foofighters = 'Foofighters'
}

export const Section = {
  args: {
    sections: [
      {
        title: 'Account',
        schema: v.object({
          avatar: v.pipe(ImageArrayInputSchema, v.title('Avatar')),
          name: v.pipe(v.string(), v.nonEmpty(), v.title('Name')),
          email: v.pipe(EmailInputSchema, v.title('E-Mail')),
          password: v.pipe(
            PasswordInputSchema,
            v.title('Passwort'),
            v.description('Keep your password safe! We do not have a recovery yet')
          )
        })
      },
      {
        title: 'Preferences',
        schema: v.object({
          favouriteBand: v.pipe(
            v.enum(Bands),
            v.title('Your favourite band'),
            v.description('Obviously not Nickleback'),
            v.brand(SELECT_BRANDING)
          ),
          favouriteColors: v.pipe(
            TagInputSchema,
            v.title('Your favourite colors'),
            v.description("Don't choose green")
          ),
          about: v.pipe(
            TextareaInputSchema,
            v.maxLength(255),
            v.title('Über dich'),
            v.description('Deine Geheimnisse sind bei uns sicher')
          )
        }),
        inputProps: {
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
        schema: v.object({
          zip: v.pipe(ZIPInputSchema, v.title('PLZ (optional)')),
          consent: v.pipe(v.boolean(), v.title('Sign me up for the newsletter'))
        }),
        defaultValues: {
          consent: true
        }
      },
      {
        title: 'Properties',
        schema: v.object({
          properties: PropertiesInputSchema
        })
      },
      {
        title: 'Links',
        schema: v.object({
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
        schema: v.object({
          name: v.pipe(v.string(), v.nonEmpty(), v.title('Name')),
          email: v.pipe(EmailInputSchema, v.title('E-Mail')),
          password: v.pipe(
            PasswordInputSchema,
            v.title('Passwort'),
            v.description('Keep your password safe! We do not have a recovery yet')
          )
        })
      },
      {
        title: 'Preferences',
        schema: v.object({
          about: v.pipe(
            TextareaInputSchema,
            v.maxLength(255),
            v.title('Über dich'),
            v.description('Deine Geheimnisse sind bei uns sicher')
          ),
          favouriteBand: v.pipe(
            v.enum(Bands),
            v.title('Your favourite band'),
            v.description('Obviously not Nickleback'),
            v.brand(SELECT_BRANDING)
          ),
          favouriteColors: v.pipe(
            TagInputSchema,
            v.title('Your favourite colors'),
            v.description("Don't choose green")
          )
        }),
        inutProps: {
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
        schema: v.object({
          zip: v.pipe(ZIPInputSchema, v.title('PLZ (optional)')),
          consent: v.pipe(v.boolean(), v.title('Sign me up for the newsletter'))
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
    schema: v.object({
      state: v.pipe(v.array(v.string()), v.brand(SELECT_BRANDING)),
      sort: v.pipe(v.array(v.string()), v.brand(SELECT_BRANDING))
    }),
    inputProps: {
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
