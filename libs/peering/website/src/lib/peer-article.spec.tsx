import {composeStories} from '@storybook/react'
import {render} from '@testing-library/react'
import * as stories from './peer-information.stories'

const storiesCmp = composeStories(stories)

describe('PeerInformation', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      render(<Component />)
    })
  })
})
