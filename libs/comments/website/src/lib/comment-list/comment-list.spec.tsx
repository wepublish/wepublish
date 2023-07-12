import {render} from '@testing-library/react'
import * as stories from './comment-list.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('CommentList', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
