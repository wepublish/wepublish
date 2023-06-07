import {Meta} from '@storybook/react'
import {HtmlBlock} from './html-block'
import {css} from '@emotion/react'

export default {
  component: HtmlBlock,
  title: 'Blocks/HTML'
} as Meta

export const Default = {
  args: {
    html: '<div style="color: red;">This is a html embed</div>'
  }
}

export const WithScript = {
  args: {
    html: `
      <div style="color: red;">Checkout your console.</div>
      <script>console.log("This is a html embed")</script>
    `
  }
}

export const WithClassName = {
  args: {
    html: '<div style="color: red;">This is a html embed</div>',
    className: 'extra-classname'
  }
}

export const WithEmotion = {
  args: {
    html: '<div style="color: red;">This is a html embed</div>',
    css: css`
      background-color: #eee;
    `
  }
}
