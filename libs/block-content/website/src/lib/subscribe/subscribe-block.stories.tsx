import {Meta} from '@storybook/react'
import {css} from '@emotion/react'
import {SubscribeBlock} from './subscribe-block'

export default {
  component: SubscribeBlock,
  title: 'Blocks/Subscribe'
} as Meta

export const Default = {
  args: {}
}

export const WithClassName = {
  args: {
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    css: css`
      background-color: #eee;
    `
  }
}
