import {render} from '@testing-library/react'
import * as stories from './navbar.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('Navbar', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />)
    })
  })
})
