import {MockedProvider} from '@apollo/client/testing'
import {composeStories} from '@storybook/react'
import {render} from '@testing-library/react'
import {actWait} from '@wepublish/testing'
import * as stories from './poll-block.stories'
import snapshotDiff from 'snapshot-diff'
import {act} from 'react-dom/test-utils'

const storiesCmp = composeStories(stories)

describe('Poll Block', () => {
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
