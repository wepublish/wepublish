import {MockedProvider} from '@apollo/client/testing'
import {ComponentType} from 'react'
import {WebsiteProvider} from '@wepublish/website'
import React from 'react'

export const parameters = {
  apolloClient: {
    MockedProvider,
    addTypename: false
  }
}

const withWebsiteProvider = (Story: ComponentType) => (
  <WebsiteProvider>
    <Story />
  </WebsiteProvider>
)

export const decorators = [withWebsiteProvider]
