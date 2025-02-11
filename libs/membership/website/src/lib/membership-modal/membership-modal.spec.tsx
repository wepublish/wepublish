import {render} from '@testing-library/react'
import * as stories from './membership-modal.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('Membership Modal', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />)
    })
  })
})
