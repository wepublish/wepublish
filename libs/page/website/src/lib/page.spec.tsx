import {render} from '@testing-library/react'
import * as stories from './page.stories'
import {composeStories} from '@storybook/react'
import {MockedProvider} from '@apollo/client/testing'

const storiesCmp = composeStories(stories)

describe('Page', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      )

      expect(asFragment()).toMatchSnapshot()
    })
  })
})
