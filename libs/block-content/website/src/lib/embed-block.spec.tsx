import {render} from '@testing-library/react'
import * as stories from './embed-block.stories'
import {composeStories} from '@storybook/react'

import fetch from 'jest-fetch-mock'
jest.setMock('node-fetch', fetch)

const storiesCmp = composeStories(stories)

describe('Embed Block', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      const {asFragment} = render(<Component />)
      expect(asFragment()).toMatchSnapshot()
    })
  })
})
