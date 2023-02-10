import {MockedProvider} from '@apollo/client/testing' // Use for Apollo Version 3+
import {ComponentType} from 'react'
import {WebsiteProvider} from '../src/lib/website.provider'

export const parameters = {
  apolloClient: {
    MockedProvider,
    addTypename: false
  }
}

const withMuiTheme = (Story: ComponentType) => (
  <WebsiteProvider>
    <Story />
  </WebsiteProvider>
)

export const decorators = [withMuiTheme]
