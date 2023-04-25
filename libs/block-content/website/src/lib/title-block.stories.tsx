import {ComponentStory, Meta} from '@storybook/react'
import {TitleBlock} from './title-block'

export default {
  component: TitleBlock,
  title: 'Blocks/Title'
} as Meta

const Template: ComponentStory<typeof TitleBlock> = args => <TitleBlock {...args} />
export const Default = Template.bind({})
Default.args = {
  title: 'This is a title',
  lead: 'This is a lead'
}

export const WithClassName = Template.bind({})
WithClassName.args = {
  title: 'This is a title',
  lead: 'This is a lead',
  className: 'extra-classname'
}
