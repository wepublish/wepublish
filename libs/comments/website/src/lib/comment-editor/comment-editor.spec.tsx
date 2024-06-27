import {render} from '@testing-library/react'
import * as stories from './comment-editor.stories'
import {composeStories} from '@storybook/react'
import {ThemeProvider} from '@mui/material/styles'
import {MockedProvider} from '@apollo/client/testing'
import {theme} from '@wepublish/ui'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    replace: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn()
    }
  }))
}))

// Compose stories
const storiesCmp = composeStories(stories)

describe('CommentEditor', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(
        <MockedProvider>
          <ThemeProvider theme={theme}>
            <Component />
          </ThemeProvider>
        </MockedProvider>
      )
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
