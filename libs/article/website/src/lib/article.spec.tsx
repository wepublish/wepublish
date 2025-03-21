import {render} from '@testing-library/react'
import * as stories from './article.stories'
import {composeStories} from '@storybook/react'
import {actWait} from '@wepublish/testing'

const storiesCmp = composeStories(stories)

describe('Article', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const {asFragment} = render(<Component />)

      await actWait()

      expect(asFragment()).toMatchSnapshot()
    })
  })
})
