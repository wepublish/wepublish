import {MockedProvider} from '@apollo/client/testing'
import {ComponentType} from 'react'
import {WebsiteBuilderProvider, WebsiteProvider} from '@wepublish/website'
import {css} from '@mui/material'
import {Global} from '@emotion/react'
import Head from 'next/head'
import Script from 'next/script'

export const parameters = {
  apolloClient: {
    MockedProvider,
    addTypename: false
  },
  options: {
    storySort: {
      method: 'alphabetical',
      order: ['Containers', '*', 'Item']
    }
  }
}

const withWebsiteProvider = (Story: ComponentType) => (
  <WebsiteProvider>
    <WebsiteBuilderProvider Head={Head} Script={Script}>
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

export const decorators = [withWebsiteProvider, withExtraClassname]
