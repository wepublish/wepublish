import {MockedProvider} from '@apollo/client/testing'
import {composeStories} from '@storybook/react'
import {render} from '@testing-library/react'
import {actWait} from '@wepublish/testing'
import * as stories from './peer-article-container.stories'

const storiesCmp = composeStories(stories)

describe('PeerArticle Container', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const {asFragment} = render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      )

      await actWait()

      expect(asFragment()).toMatchSnapshot()
    })
  })
})
