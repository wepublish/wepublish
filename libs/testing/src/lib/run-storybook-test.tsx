import {ReactRenderer, composeStories} from '@storybook/react'
import {ComposedStoryFn} from '@storybook/types'
import {act, render} from '@testing-library/react'
import snapshotDiff from 'snapshot-diff'
import {MockedProvider} from '@apollo/client/testing'
import {actWait} from './act-wait'

export function runStorybookTests<T extends Parameters<typeof composeStories>[0]>(
  stories: T,
  defaultStory: keyof T = 'Default' as keyof T,
  settings?: Parameters<typeof composeStories>[1]
) {
  const storiesCmp = composeStories(stories, settings)
  let defaultSnapshot: DocumentFragment | undefined
  let DefaultComponent: ComposedStoryFn<ReactRenderer> | undefined

  const setDefault = async () => {
    if (DefaultComponent && defaultSnapshot) {
      return
    }

    if (defaultStory in storiesCmp) {
      DefaultComponent = storiesCmp[
        defaultStory as keyof typeof storiesCmp
      ] as ComposedStoryFn<ReactRenderer>
      const {container, asFragment} = render(<DefaultComponent />)

      if (DefaultComponent?.play) {
        await act(() => DefaultComponent?.play?.({canvasElement: container}))
      }

      defaultSnapshot = asFragment()
    }
  }

  Object.entries(storiesCmp).forEach(([story, Cmp]) => {
    it(`should render ${story}`, async () => {
      const Component = Cmp as ComposedStoryFn<ReactRenderer>
      const {container, asFragment} = render(<Component />)

      if (Component.play) {
        const before = asFragment()
        await act(() => Component.play?.({canvasElement: container}))
        const after = asFragment()

        expect(snapshotDiff(before, after)).toMatchSnapshot()
      } else {
        await setDefault()

        if (defaultSnapshot && DefaultComponent !== Component) {
          expect(snapshotDiff(defaultSnapshot, asFragment())).toMatchSnapshot()
        } else {
          expect(asFragment()).toMatchSnapshot()
        }
      }
    })
  })
}

export function runStorybookContainerTests<T extends Parameters<typeof composeStories>[0]>(
  stories: T,
  defaultStory: keyof T = 'Default' as keyof T,
  settings?: Parameters<typeof composeStories>[1]
) {
  const storiesCmp = composeStories(stories, settings)
  let defaultSnapshot: DocumentFragment | undefined
  let DefaultComponent: ComposedStoryFn<ReactRenderer> | undefined

  const setDefault = async () => {
    if (DefaultComponent && defaultSnapshot) {
      return
    }

    if (defaultStory in storiesCmp) {
      DefaultComponent = storiesCmp[
        defaultStory as keyof typeof storiesCmp
      ] as ComposedStoryFn<ReactRenderer>

      const {container, asFragment} = render(
        <MockedProvider {...DefaultComponent.parameters?.apolloClient}>
          <DefaultComponent />
        </MockedProvider>
      )

      await actWait()

      if (DefaultComponent.play) {
        await act(() => DefaultComponent?.play?.({canvasElement: container}))
      }

      defaultSnapshot = asFragment()
    }
  }

  Object.entries(storiesCmp).forEach(([story, Cmp]) => {
    it(`should render ${story}`, async () => {
      const Component = Cmp as ComposedStoryFn<ReactRenderer>

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
        await setDefault()

        if (defaultSnapshot && DefaultComponent !== Component) {
          expect(snapshotDiff(defaultSnapshot, asFragment())).toMatchSnapshot()
        } else {
          expect(asFragment()).toMatchSnapshot()
        }
      }
    })
  })
}
