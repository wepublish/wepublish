import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {TeaserGridBlock as TeaserGridBlockType} from '@wepublish/website/api'
import {TeaserGridBlock} from './teaser-grid-block'
import {articleTeaser, pageTeaser, customTeaser} from '@wepublish/testing/fixtures/graphql'

export default {
  component: TeaserGridBlock,
  title: 'Blocks/Teaser Grid'
} as Meta

const flexTeaser = {
  __typename: 'TeaserGridBlock',
  teasers: [articleTeaser, pageTeaser, customTeaser],
  numColumns: 3
} as TeaserGridBlockType

export const OneColumn = {
  args: {
    ...flexTeaser,
    numColumns: 1
  }
}

export const ThreeColumns = {
  args: {
    ...flexTeaser
  }
}

export const WithShowLoad = {
  args: {
    ...flexTeaser,
    showLead: true
  }
}

export const WithClassName = {
  args: {
    ...flexTeaser,
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    ...flexTeaser,
    css: css`
      background-color: #eee;
    `
  }
}
