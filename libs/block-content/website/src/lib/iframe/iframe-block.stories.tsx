import {Meta} from '@storybook/react'
import {IFrameBlock} from './iframe-block'
import {css} from '@emotion/react'

export default {
  component: IFrameBlock,
  title: 'Blocks/IFrame'
} as Meta

export const Default = {
  args: {
    url: 'https://www.example.com',
    title: 'Title',
    width: 560,
    height: 314,
    styleCustom: 'background: #aaa; padding: 50px;',
    sandbox: ''
  }
}

export const WithEmotion = {
  ...Default,
  args: {
    ...Default.args,
    css: css`
      background-color: #eee;
    `
  }
}

export const WithClassName = {
  ...Default,
  args: {
    ...Default.args,
    className: 'extra-classname'
  }
}
