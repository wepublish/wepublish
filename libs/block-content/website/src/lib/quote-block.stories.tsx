import {ComponentStory, Meta} from '@storybook/react'
import {QuoteBlock} from './quote-block'
import {css} from '@emotion/react'

export default {
  component: QuoteBlock,
  title: 'Blocks/Quote'
} as Meta

const Template: ComponentStory<typeof QuoteBlock> = args => <QuoteBlock {...args} />
export const Default = Template.bind({})
Default.args = {
  quote: 'This is a quote',
  author: 'John Doe'
}

export const WithClassName = Template.bind({})
WithClassName.args = {
  quote: 'This is a quote',
  author: 'John Doe',
  className: 'extra-classname'
}

export const WithEmotion = Template.bind({})
WithEmotion.args = {
  quote: 'This is a quote',
  author: 'John Doe',
  css: css`
    background-color: #eee;
  `
} as any // The css prop comes from the WithConditionalCSSProp type by the Emotion JSX Pragma
