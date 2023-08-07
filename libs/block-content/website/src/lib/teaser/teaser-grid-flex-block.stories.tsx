import {css} from '@emotion/react'
import {Meta} from '@storybook/react'
import {TeaserGridFlexBlock} from './teaser-grid-flex-block'
import {flexTeaser} from '@wepublish/testing/fixtures/graphql'

export default {
  component: TeaserGridFlexBlock,
  title: 'Blocks/Teaser Grid Flex'
} as Meta

export const Default = {
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
