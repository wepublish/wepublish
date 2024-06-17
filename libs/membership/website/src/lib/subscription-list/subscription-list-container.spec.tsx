import {MockedProvider} from '@apollo/client/testing'
import {composeStories} from '@storybook/react'
import {act, render} from '@testing-library/react'
import {actWait, addDateMock} from '@wepublish/testing'
import snapshotDiff from 'snapshot-diff'
import * as stories from './subscription-list-container.stories'

const storiesCmp = composeStories(stories)

describe('SubscriptionList Container', () => {
  addDateMock()

  beforeAll(() => {
    Object.defineProperty(global.window, 'location', {
      value: {
        href: 'http://localhost'
      }
    })
  })

  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const {container, asFragment} = render(
        <MockedProvider {...Component.parameters?.apolloClient}>
          <Component />
        </MockedProvider>
      )

      await actWait()

      if (Component.play) {
        const before = asFragment()
        await act(() => Component.play?.({canvasElement: container}))
        const after = asFragment()

        expect(snapshotDiff(before, after)).toMatchSnapshot()
      } else {
        expect(asFragment()).toMatchSnapshot()
      }
    })
  })
})
