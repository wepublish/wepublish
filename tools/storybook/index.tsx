import {MockedProvider} from '@apollo/client/testing'
import {ComponentType} from 'react'
import {WebsiteProvider} from '@wepublish/website'
import React from 'react'
import {css} from '@mui/material'
import {Global} from '@emotion/react'

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
    <Story />
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
