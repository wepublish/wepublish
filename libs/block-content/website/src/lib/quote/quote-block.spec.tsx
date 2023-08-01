import {render} from '@testing-library/react'
import * as stories from './quote-block.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('Quote Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
