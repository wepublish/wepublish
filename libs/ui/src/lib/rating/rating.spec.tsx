import {render} from '@testing-library/react'
import * as stories from './rating.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('Rating', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
