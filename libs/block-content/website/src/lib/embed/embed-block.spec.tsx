import {render} from '@testing-library/react'
import * as stories from './embed-block.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('Embed Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />)
    })
  })
})
