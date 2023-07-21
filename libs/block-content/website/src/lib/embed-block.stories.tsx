import {Meta} from '@storybook/react'
import {EmbedBlock} from './embed-block'
import {css} from '@emotion/react'

export default {
  component: EmbedBlock,
  title: 'Blocks/Embed'
} as Meta

export const Default = {
  args: {
    value: 'todo'
  }
}

export const WithClassName = {
  args: {
    value: 'todo',
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    value: 'todo',
    css: css`
      background-color: #eee;
    `
  }
}
