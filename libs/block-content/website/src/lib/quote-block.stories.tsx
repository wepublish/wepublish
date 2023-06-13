import {Meta} from '@storybook/react'
import {QuoteBlock} from './quote-block'
import {css} from '@emotion/react'

export default {
  component: QuoteBlock,
  title: 'Blocks/Quote'
} as Meta

export const Default = {
  args: {
    quote: 'This is a quote',
    author: 'John Doe'
  }
}

export const WithClassName = {
  args: {
    quote: 'This is a quote',
    author: 'John Doe',
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    quote: 'This is a quote',
    author: 'John Doe',
    css: css`
      background-color: #eee;
    `
  }
}
