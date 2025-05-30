import {render} from '@testing-library/react'
import * as stories from './modal.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('Modal', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />)
    })
  })
})
