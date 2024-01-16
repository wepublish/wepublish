import {MockedProvider} from '@apollo/client/testing'
import {composeStories} from '@storybook/react'
import {act, render} from '@testing-library/react'
import {actWait} from '@wepublish/testing'
import * as stories from './login-form-container.stories'
import snapshotDiff from 'snapshot-diff'

const storiesCmp = composeStories(stories)

describe('Login Form Container', () => {
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
