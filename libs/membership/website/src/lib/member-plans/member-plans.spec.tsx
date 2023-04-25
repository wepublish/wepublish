import {render} from '@testing-library/react'
import * as stories from './member-plans.stories'
import {composeStories} from '@storybook/react'

const storiesCmp = composeStories(stories)

describe('MemberPlans', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
