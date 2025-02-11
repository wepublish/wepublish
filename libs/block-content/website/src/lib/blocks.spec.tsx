import {render} from '@testing-library/react'
import * as stories from './blocks.stories'
import {composeStories} from '@storybook/react'
import {hasBlockStyle} from './blocks'

const storiesCmp = composeStories(stories)

describe('Blocks', () => {
  Object.entries(storiesCmp).forEach(([story, Component]) => {
    it(`should render ${story}`, () => {
      render(<Component />)
    })
  })

  it('should return if a block as a given style set', () => {
    const hasFoobarStyle = hasBlockStyle('foobar')

    expect(hasFoobarStyle({blockStyle: 'foobar'})).toBeTruthy()
    expect(hasFoobarStyle({blockStyle: 'barfoo'})).toBeFalsy()
  })
})
