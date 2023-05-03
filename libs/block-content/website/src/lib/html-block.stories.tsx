import {ComponentStory, Meta} from '@storybook/react'
import {HtmlBlock} from './html-block'
import {css} from '@emotion/react'

export default {
  component: HtmlBlock,
  title: 'Blocks/HTML'
} as Meta

const Template: ComponentStory<typeof HtmlBlock> = args => <HtmlBlock {...args} />
export const Default = Template.bind({})
Default.args = {
  html: '<div style="color: red;">This is a html embed</div>'
}

export const WithScript = Template.bind({})
WithScript.args = {
  html: `
    <div style="color: red;">Checkout your console.</div>
    <script>console.log("This is a html embed")</script>
  `
}

export const WithClassName = Template.bind({})
WithClassName.args = {
  html: '<div style="color: red;">This is a html embed</div>',
  className: 'extra-classname'
}

export const WithEmotion = Template.bind({})
WithEmotion.args = {
  html: '<div style="color: red;">This is a html embed</div>',
  css: css`
    background-color: #eee;
  `
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma
