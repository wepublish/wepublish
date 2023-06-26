import {MockedProvider} from '@apollo/client/testing'
import {ComponentType} from 'react'
import {WebsiteBuilderProvider, WebsiteProvider} from '@wepublish/website'
import {CssBaseline, css} from '@mui/material'
import {Global} from '@emotion/react'
import Head from 'next/head'
import Script from 'next/script'
import {Preview} from '@storybook/react'

export const parameters = {
  apolloClient: {
    MockedProvider,
    addTypename: false
  },
  options: {
    storySort: {
      includeName: true,
      method: 'alphabetical',
      order: [
        'Getting Started',
        'Overview',
        'Installation',
        'Usage',
        'Learn',
        'FAQ',
        'Glossary',
        '*',
        'Item'
      ]
    }
  }
} as Preview['parameters']

const withWebsiteProvider = (Story: ComponentType) => (
  <WebsiteProvider>
    <WebsiteBuilderProvider Head={Head} Script={Script}>
      <CssBaseline />
      <Story />
    </WebsiteBuilderProvider>
  </WebsiteProvider>
)

const extraClassname = css`
  .extra-classname {
    background-color: pink;
  }
`

const withExtraClassname = (Story: ComponentType) => {
  return (
    <>
      <Global styles={extraClassname} />

      <Story />
    </>
  )
}

export const decorators = [withWebsiteProvider, withExtraClassname] as Preview['decorators']
