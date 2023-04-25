import {ComponentStory, Meta} from '@storybook/react'
import {QuoteBlock} from './quote-block'

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
