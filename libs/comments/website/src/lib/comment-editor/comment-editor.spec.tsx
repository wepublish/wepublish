import {render} from '@testing-library/react'
import * as stories from './comment-editor.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('CommentEditor', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
