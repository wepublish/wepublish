import {act, render} from '@testing-library/react'
import * as stories from './comment.stories'
import {composeStories} from '@storybook/react'
import snapshotDiff from 'snapshot-diff'

const storiesCmp = composeStories(stories)

describe('Comment', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, async () => {
      const {container, asFragment} = render(<Component />)

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
