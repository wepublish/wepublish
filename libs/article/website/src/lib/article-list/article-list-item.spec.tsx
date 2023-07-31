// import {MockedProvider} from '@apollo/client/testing'
import {composeStories} from '@storybook/react'
import {render} from '@testing-library/react'
import * as stories from './article-list-item.stories'

const storiesCmp = composeStories(stories)

describe('ArticleList Item', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const {asFragment} = render(<Component />)

      expect(asFragment()).toMatchSnapshot()
    })
  })
})
