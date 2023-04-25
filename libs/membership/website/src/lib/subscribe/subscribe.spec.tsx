import {render} from '@testing-library/react'
import * as stories from './subscribe.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('Subscribe', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
